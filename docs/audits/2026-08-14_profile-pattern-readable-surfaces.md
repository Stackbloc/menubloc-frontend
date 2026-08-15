# Profile readable surfaces on patterned Restaurant Styles

**Date:** 2026-08-14  
**FE:** `menubloc-frontend-main`

## Summary

Section titles and muted copy on public profiles (Deals, Updates, Favorites, About, Windows, What Diners Are Saying, Tips & discussion) now sit on solid white cards via `profileReadableSurfaceStyle`, so patterned Restaurant Styles (e.g. Klaudette `jamaican`) stay readable.

## Problem Statement

Busy yellow+green Jamaican pattern made bare black/grey headings and disclaimers hard to read while white content boxes were fine.

## Root Cause

Titles and muted text rendered outside white surfaces on `--profile-pattern`.

## Changes Made

- `profileReadableSurfaceStyle` in `profilePrimitives.jsx`
- Applied to Deals, Updates, Favorites, About, Windows, WhatDiners, FoodComments
- Contract extended in `restaurantProfileStyleContract.test.js`

## Deployment Status

- FE `58d7bca` → `menubloc-frontend-6sk4due4f-menuply.vercel.app` / `index-D-I_Y4hm.js`
- Aliased menuply.com + www (+ crm); tip-gate PASS
- **CPD COMPLETE**
