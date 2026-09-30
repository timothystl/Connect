# Facilities bundle import

Facilities → Assets → "Import a prepared bundle" loads assets, capital projects, service
entries, and their PDFs/photos in one post (`facility-import.js`). Choose `manifest.json`
and, in the second box, every file the manifest lists. Limits: 40 files, 20 MB each, 64 MB total.
The whole bundle is validated first; nothing is saved if any row or file is wrong. Records
already present (asset: same name and category; project: same name; service: same asset, date
and description) are reused, and a file with the same name already on a record is skipped, so
re-running is safe. Needs a role that can edit Facilities.

```json
{
  "version": 1,
  "assets": [
    { "key": "boiler", "name": "Main boiler", "category": "HVAC", "location": "Basement",
      "installed_month": "2020-03", "expected_life_years": 25, "replacement_cost": "85000",
      "model": "", "serial": "", "warranty": "", "vendor": "JN Certified", "notes": "" }
  ],
  "projects": [
    { "key": "hvac2020", "name": "HVAC replacement", "scope": "", "status": "Completed",
      "target_month": "2020-03", "cost": "120000", "vendor": "JN Certified", "warranty": "",
      "useful_life_years": 20, "funding": "", "notes": "" }
  ],
  "service": [
    { "key": "s1", "asset": "boiler", "service_date": "2020-03-28", "service_type": "Replacement",
      "description": "Boiler installed", "vendor": "JN Certified", "cost": "0" }
  ],
  "documents": [
    { "file": "JNCertified-Proposal20200107signed.pdf", "record": "hvac2020", "caption": "Signed proposal, Jan 2020" }
  ]
}
```

Field rules match the ordinary forms. `category` is one of HVAC, Boilers, Elevator, Roofs,
Electrical, Kitchen, Fire & security, Plumbing, Playground, Vehicles & equipment, Doors,
Grounds, Other. `status` is Planned, In progress, or Completed. `service_type` is Repair,
Inspection, Preventive, or Replacement. Months are `YYYY-MM`, dates `YYYY-MM-DD`, money is
dollars. Every record needs a unique short `key`; `documents[].record` and `service[].asset`
refer to those keys, and `documents[].file` must match an uploaded file name.
Only include values that appear in the source documents.
