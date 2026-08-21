/**
 * Lightweight editorial empty state for My Menuply presentation sections.
 * No camera boxes, forms, or add buttons — creation stays on bottom-nav X.
 */

export default function SectionEmptyState({ children, testId }) {
  return (
    <p style={styles.copy} data-testid={testId}>
      {children}
    </p>
  );
}

const styles = {
  copy: {
    margin: "4px 0 0",
    fontSize: 14,
    lineHeight: 1.5,
    color: "#667085",
    fontStyle: "italic",
    fontFamily: "inherit",
  },
};
