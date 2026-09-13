# ABC Event Schema v0.1

A machine-readable form of what India's **Animal Birth Control (Dogs) Rules 2023**
already require every ABC centre to record. Nothing here is invented: each field
maps to a named field in Rule 12(1), Schedule III or Schedule IV. The Rules are a
PDF; this is the same thing as JSON and CSV, so software can validate it and a
monthly return can be *derived* from the ledger rather than typed in.

Schema: [`/schema/abc-event.v0.1.json`](../public/schema/abc-event.v0.1.json) · Licence: CC-BY-4.0

## Why

Municipalities pay NGOs ₹1,450–1,850 per sterilised dog against a monthly return
of *daily aggregate counts* signed by two officers. No per-dog record leaves the
centre. Ratlam claimed 33,630 sterilisations and was paid ₹2.29 crore; a survey
found 2,204. Mandla police seized 795 preserved organs from an NGO that had done
no surgeries. Patna's "sterilised" dogs came back unnotched and later pregnant.

A per-dog event ledger with a veterinarian's registration number, a provenance
tier and a hash chain is the missing verification layer. This schema is the
shape of that ledger.

## Mapping

| Rules 2023 | Field | Notes |
|---|---|---|
| Rule 12(1)(i) area of capture | `locality`, `ward` on a `capture` event | Zone or ward. **Coordinates are not permitted.** |
| Rule 12(1)(ii) date and time | `occurred_at` | ISO 8601 |
| Rule 12(1)(iii) capturing squad | `performed_by` | |
| Rule 11(8) / 12(1)(iv) tag number | `tag_number` | |
| Rule 12(1)(iv) sex, colour, marks, age | `sex`, `colour`, `identification_marks`, `approx_age` | |
| Rule 11(16) ear notch | `ear_notch` | Observed only — **not proof of surgery** |
| Rule 12(1)(vi) release date/time/place | `release` event: `occurred_at`, `locality` | |
| Schedule III vet name / registration no. | `vet_name`, `vet_registration_no` on `sterilisation` | Required when `source` is verified |
| Schedule III complications / mortality | `complication`; `death` event | |
| Schedule IV daily counts | derived: `capture`, `sterilisation`, `observation`, `release`, `death` per day | See `scheduleIV()` |
| Identity | `nddb_id` (15 digits, ISO 11784) or `local_id` | MCD already stamps NDDB IDs on dogs |
| Provenance | `source` | `pho_record` \| `awo_certificate` \| `feeder_report` \| `unknown` |
| Evidence | `evidence_hash` | SHA-256 of a certificate/photo held elsewhere |

## Rules of the schema

1. **Verified surgeries need a vet.** A `sterilisation` with `source` `pho_record` or
   `awo_certificate` must carry `vet_registration_no`. A feeder's report may not.
2. **A notch is an observation.** `ear_notch: right` records what was seen. It does
   not create a sterilisation event and must not be counted as one.
3. **No coordinates.** `locality` is a zone or ward. Any `lat`/`lng` field fails validation.
4. **Returns are derived.** Schedule III and IV are computed from events. A return
   cannot claim more than the ledger contains.
5. **Recorders are pseudonyms.** `recorded_by` is never a name, phone or email.

## Who could adopt it

Rule 13(iii) lets the Board or a State Board require reports "in prescribed
format". The realistic order: one Local ABC Monitoring Committee (Rule 9(4)) →
one State committee → NDDB for the ID namespace → AWBI.

## Reference implementation

`lib/abc-events.ts` in this repository: types, a validator, an adapter from
PawBook's own records, and `scheduleIII()` / `scheduleIV()`. The register export
includes `abc-events.csv` in Rule 12(1) column order.
