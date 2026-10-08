# Controlled pilot: scope, evidence, and release gates

## Intended release

The intended next milestone is a **private, supervised research pilot**, not a public or commercial production release. The supported task remains one **isolated, static ASL fingerspelled handshape per capture**. It returns one English letter label for A-I and K-Y (24 static letters). It does not recognize J or Z, words, phrases, continuous signing, ASL grammar, facial/non-manual features, or sentence translations. `SPACE` is not part of the pilot vocabulary; it is a dataset control label, not a static ASL handshape. An absent/uncertain hand must not be converted to a letter.

The pilot is for consenting adult participants under facilitator supervision, with a non-sign-language communication method available. Do not rely on results for emergency, medical, legal, financial, or other consequential communication. Participation must not be represented as access to a qualified interpreter.

## Current evidence and decision

The Kaggle ASL Alphabet image set has no signer identities or reliable recording-condition metadata. Its 26-image held-out set contains one still image per class, so it cannot establish signer-independent or real-world accuracy. A 5-epoch classifier run reported 99.30% image-level validation accuracy and 26/26 classifier-only results on that tiny image set. With the hand detector in the HTTP pipeline, only 18/26 were accepted (69.2% coverage); all 18 accepted outputs were correct, while eight held-out handshapes were rejected. Validation sampling found 83.3% hand-detection recall and 98.4% no-hand specificity at the selected detector threshold. These are dataset-specific development measurements, **not pilot qualification evidence**.

**Decision: NOT READY FOR PILOT USE.** The current system is suitable only for supervised engineering evaluation. The signer-independent dataset, an agreed staging target, database-backed end-to-end validation, and consenting-user camera trials have not yet been completed.

## Data collection and partition protocol

1. Obtain explicit, documented consent before recording. Explain the purpose, exact fields collected, who can access them, retention/deletion process, and that withdrawal is possible. Do not record until the project owner has approved the consent form and storage/retention policy. This protocol is an engineering checklist, not legal advice or a participant consent form.
2. Use random pseudonymous signer IDs. Do not put participant names, email addresses, phone numbers, or contact details in the dataset manifest, filenames, logs, or sample metadata. Keep any consent/contact ledger separately with restricted access.
3. Collect the supported isolated handshapes from multiple consenting signers using several repetitions. Vary lighting, background, distance, camera angle, signing speed, and device/camera where feasible. Recruit for a range of skin tones and hand sizes, but do not infer these attributes from camera frames. If subgroup analysis is necessary, use a separate voluntary, coarse-grained, privacy-reviewed intake with aggregate reporting. Do not collect face video for this static-handshape pilot. Negative test frames may include faces, objects, partial hands, unsupported signs, or multiple hands only where necessary for rejection testing and explicitly covered by consent.
4. For images that must be retained, store only under access control and encryption, outside Git and web roots. Record a consent version and timestamp for each signer. Agree and document a retention deadline and deletion procedure before collection. Never silently reuse withdrawn data.
5. Assign each signer to exactly one partition **before model training**: `train`, `validation`, or `test`. Every sample from one signer stays in that partition. The final test signers must be unseen during training, threshold selection, architecture selection, and tuning. Keep the test labels and results sealed from model-development decisions until the model/configuration is frozen.
6. Require all supported labels and condition coverage in the final report. Report both per-frame and per-signer results; summarize signer-level performance so a high-volume signer cannot dominate the aggregate. The validator requires five separate final-test captures per supported letter per test signer, at least 500 test-negative frames, and minimum examples in each rejection category.
7. Treat public image data without signer identity/provenance as auxiliary development material only. It cannot substantiate a signer-independent split or replace the consented unseen-signer test.

The validation utility in `ml-service/pilot_data/` checks an explicit sample manifest, participant consent flags, metadata, paths, images, and signer-disjoint splits. It does not collect recordings, establish that consent is legally sufficient, or certify that people in external datasets are absent from the data.

## Provisional acceptance gates

These are minimum engineering gates for a **supervised, non-consequential pilot**, not a claim that the tool is safe or suitable as an interpreter. The pilot owner must approve these before opening participant sessions. All metrics must be measured on the frozen model using unseen test signers and the actual intended pilot devices.

| Area | Minimum gate before supervised pilot |
| --- | --- |
| Dataset | At least 12 consenting test signers, each providing at least 5 repetitions of every supported label. No signer overlap between train, validation, and final test. Include at least 3 capture conditions and 2 camera/device types in test if available; document gaps. Recruit a range of skin tones and hand sizes; do not infer traits from images. If privacy-approved subgroup data is unavailable, explicitly limit generalization claims. |
| Accepted predictions | At least 98% precision among accepted letter predictions, with a 95% confidence interval reported. |
| Coverage/recall | At least 90% of valid in-scope test attempts yield a correct accepted result; report per-signer and per-class results, with no signer below 80%. Uncertain/rejected attempts count as failures for this gate. |
| Negative/unknown rejection | At least 99% of no-hand/poor-quality/unsupported test attempts must not be emitted as accepted letters. Include held-out non-sign images, objects, partial hands, unsupported signs, and multiple-hand frames. |
| Stability | In repeated live-camera trials, one held sign must produce no more than one accepted event until the signer releases/changes the handshape; report duplicate and missed events. |
| Latency | On the declared pilot deployment and device mix, camera-capture-to-visible-result p95 <= 1,000 ms and p99 <= 2,000 ms. Report ML, API, and UI latency separately. |
| API/reliability | Recognition API 5xx/timeout rate < 1% over at least 1,000 requests at the planned pilot concurrency; no unhandled process failures in a 2-hour soak test. |
| Security/privacy | No unauthenticated recognition or cross-user data access; image frames are not logged or persisted by default; deletion and retention behavior is tested; secrets are not present in the repository. |
| Complete flow | Fresh staging deployment passes registration/login, camera permission, recognition, session record storage/retrieval, user isolation, service-failure handling, restart, and database backup/restore tests. |

If the dataset size, hardware availability, or participant recruitment cannot meet these gates, report the shortfall and remain in engineering evaluation; do not lower the gates after observing test results.

## Longer-term recognition roadmap

- **Pilot milestone:** isolated static handshapes with explicit start/capture/release behavior, hand detection, conservative uncertainty, and signer-independent evaluation.
- **Later milestone:** continuous fingerspelling and selected dynamic signs with temporal features, segmentation, and sequence-level evaluation.
- **Separate research milestone:** broader ASL recognition using hands, body posture, facial expression, non-manual markers, two-handed signs, and a language-aware translation layer reviewed by qualified Deaf/ASL language experts.

Frame-by-frame label concatenation is not an acceptable substitute for temporal recognition or ASL translation.

## Operational blockers to release

- Recruit consenting participants and obtain project/privacy review of consent, storage, access, retention, and deletion procedures.
- Collect a signer-labeled dataset with environment metadata and an unseen-signer test partition.
- Replace the image-random Kaggle split as the release-evaluation basis; report per-class/per-signer metrics and unknown rejection.
- Fix and remeasure the hand detector's missed-sign behavior without tuning against the final test set.
- Select and provision a staging deployment for frontend, backend, inference, and PostgreSQL.
- Run database-backed security, browser-camera, failure-mode, load, soak, backup/restore, and end-to-end tests in staging.
- Obtain pilot-owner approval for the acceptance gates above and review external dataset/model-asset usage terms before distribution.
