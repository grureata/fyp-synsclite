# Consented pilot data format and checks

This folder defines tooling for a future consented, signer-independent pilot dataset. It does not contain recordings or participant information. Do not commit camera data, manifests containing signer IDs, consent records, or generated split reports.

## Before collecting anything

- The project owner must approve the participant consent form, privacy notice, data access list, encrypted storage location, retention deadline, and deletion/withdrawal procedure.
- Consent must be obtained before recording, separately from account registration. Participation must be voluntary and not required to use the software.
- Use pseudonymous signer IDs only. Keep any identity-to-ID ledger separately, encrypted, and access-restricted. Do not put participant contact information in image paths, manifests, or logs.
- The current tool verifies a consent flag/version/timestamp in the manifest; that is an operational check, not proof of legally adequate consent.
- Do not retain full frames or faces unless the approved protocol requires them. The static pilot does not need face video.

## Layout

Store images in a private directory outside the repository and web roots:

```text
private-pilot-data/
  manifest.csv
  images/
    sample-000001.jpg
    sample-000002.jpg
```

Manifest columns are exact and intentionally exclude direct identifiers:

```text
sample_id,relative_path,label,signer_id,split,consent_granted,consent_version,consented_at,recorded_at,device,negative_type,lighting,distance_cm,camera_angle,background,signing_speed
sample-000001,images/sample-000001.jpg,A,signer-001,train,true,pilot-v1,2026-10-01T10:00:00Z,2026-10-01T10:10:00Z,device-01,not_applicable,indoor,75,front,plain,normal
```

`label` must be one of A-I, K-Y, or `NOTHING`. Only A-I and K-Y are in-scope pilot letters; `NOTHING` is a negative/no-hand class, not an ASL sign. `SPACE` is deliberately excluded because it is a legacy dataset control label, not a static handshape.

Use only the controlled metadata categories in the validator. `device` must be an opaque `device-*` code, not a make/model string that could identify a participant. Skin tone and hand size are not collected in this manifest by default; if representation gaps need measuring, the project owner must approve a separate, voluntary, minimal, coarse-grained collection method and explain it in participant consent.

`negative_type` is `not_applicable` for a letter and one of `no_hand`, `object`, `face`, `partial_hand`, `multiple_hands`, `unsupported_sign`, or `poor_quality` for a `NOTHING` negative sample. The test partition must contain at least 500 negative samples overall and at least 25 examples in each required negative category. Each of its 12 or more unseen signers must provide at least five separate captures for every in-scope letter.

Image filenames must be exactly the matching opaque `sample-*` ID under `images/`, and image files must be <=10 MB. This prevents participant identifiers from being added to path names by mistake.

`split` is assigned per signer and must be exactly `train`, `validation`, or `test`. No signer may appear in more than one split. Do not use this utility to reshuffle a final test set after examining model results.

## Validate the manifest

Run from `ml-service/` after installing its requirements:

```sh
.venv/bin/python pilot_data/validate_manifest.py \
  --manifest /secure/path/private-pilot-data/manifest.csv \
  --image-root /secure/path/private-pilot-data \
  --report /secure/path/private-pilot-data/validation-report.json
```

The command fails for missing/extra columns, unconsented samples, invalid labels/splits, duplicate IDs, signer leakage, missing metadata, invalid image paths/bytes, missing classes in any partition, fewer than the default 3 train, 3 validation, or 12 final test signers, fewer than five test repetitions per signer/letter, fewer than 500 test-negative samples, or missing negative categories. The report includes only signer counts and per-class/per-split sample counts (not signer IDs or file paths).

This is dataset-integrity tooling, not a model-training pipeline. The current model trainer still uses Kaggle's image-level split; do not use its image-random metrics as pilot qualification. The next model-data integration must consume a validated signer-disjoint manifest and preserve the split through architecture selection and threshold calibration.
