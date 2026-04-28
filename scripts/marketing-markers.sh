#!/usr/bin/env bash
# Shared source-of-truth for the "Friendly Universe" marker strings that must
# appear in the rendered marketing homepage HTML.
#
# Both production smoke checks (verify-marketing-deploy.sh) and pre-merge PR
# checks (verify-marketing-build.sh) source this file so the two assertions
# can never drift apart. If the homepage redesign legitimately drops or
# renames a marker, update it here and both checks stay in sync.
#
# Marker provenance:
#   "Learning adventures"  -> Hero headline
#                             apps/marketing/src/components/marketing/Hero.tsx
#                             text from i18n key marketing.hero.title_line1
#                             (apps/marketing/src/i18n/messages/en.json)
#   "COPPA", "FERPA", "SOC 2" -> Footer trust lock badge
#                             apps/marketing/src/components/marketing/Footer.tsx
#                             ("COPPA · FERPA · SOC 2")
#
# Usage (bash):
#   source "$(dirname "$0")/marketing-markers.sh"
#   for m in "${MARKETING_MARKERS[@]}"; do ... ; done

# shellcheck disable=SC2034  # consumers read this array after sourcing
MARKETING_MARKERS=(
  "Learning adventures"
  "COPPA"
  "FERPA"
  "SOC 2"
)
