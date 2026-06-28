export async function promoteWithRollback({ blue, green, aliases, probeImpl, aliasImpl }) {
  const record = {
    blue_deployment_url: blue.url,
    blue_deployment_id: blue.id,
    green_deployment_url: green.url,
    green_deployment_id: green.id,
    alias_switch_time: "",
    production_tests: [],
    rollback_status: "not_required",
  };
  let switchStarted = false;
  try {
    for (const alias of aliases) {
      switchStarted = true;
      await aliasImpl(green.url, alias);
    }
    record.alias_switch_time = new Date().toISOString();
    for (const alias of aliases) record.production_tests.push(...await probeImpl(`https://${alias}`));
    const failed = record.production_tests.filter((result) => !result.pass);
    if (failed.length) throw new Error(`production smoke failed: ${failed.map((f) => `${f.endpoint}=${f.failure_type}`).join(", ")}`);
    return record;
  } catch (error) {
    if (switchStarted) {
      const rollbackErrors = [];
      for (const alias of aliases) {
        try { await aliasImpl(blue.url, alias); }
        catch (rollbackError) { rollbackErrors.push(`${alias}: ${rollbackError.message}`); }
      }
      record.rollback_status = rollbackErrors.length ? `failed: ${rollbackErrors.join("; ")}` : "restored_blue";
    }
    error.releaseRecord = record;
    throw error;
  }
}

export async function executeBlueGreenRelease(options) {
  const greenTests = await options.probeImpl(options.green.url);
  const failures = greenTests.filter((result) => !result.pass);
  if (failures.length) {
    const error = new Error(`GREEN smoke failed: ${failures.map((f) => `${f.endpoint}=${f.failure_type}`).join(", ")}`);
    error.releaseRecord = {
      blue_deployment_url: options.blue.url,
      blue_deployment_id: options.blue.id,
      green_deployment_url: options.green.url,
      green_deployment_id: options.green.id,
      green_tests: greenTests,
      alias_switch_time: "",
      production_tests: [],
      rollback_status: "not_required_alias_unchanged",
    };
    throw error;
  }
  if (typeof options.certifyImpl !== "function") {
    const error = new Error("release is NOT CERTIFIED: certification provider is required");
    error.releaseRecord = { blue_deployment_url: options.blue.url, blue_deployment_id: options.blue.id, green_deployment_url: options.green.url, green_deployment_id: options.green.id, green_tests: greenTests, alias_switch_time: "", production_tests: [], rollback_status: "not_required_alias_unchanged", certification: "NOT CERTIFIED" };
    throw error;
  }
  const certificate = await options.certifyImpl(greenTests);
  if (certificate?.certification !== "CERTIFIED") {
    const error = new Error("release is NOT CERTIFIED");
    error.releaseRecord = { blue_deployment_url: options.blue.url, blue_deployment_id: options.blue.id, green_deployment_url: options.green.url, green_deployment_id: options.green.id, green_tests: greenTests, alias_switch_time: "", production_tests: [], rollback_status: "not_required_alias_unchanged", certification: certificate };
    throw error;
  }
  const record = await promoteWithRollback(options);
  record.green_tests = greenTests;
  record.certification = certificate;
  return record;
}
