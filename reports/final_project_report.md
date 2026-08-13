# Hospital 30-Day Readmission Prediction System — Final Project Report

**Hackathon Prototype Project Report**  
*Target: Binary Classification (readmitted: no -> 0, yes -> 1)*  
*Operating Decision Threshold: 0.30*

---

## 1. Problem Statement
Hospital 30-day readmissions are a major quality-of-care metric and financial burden in healthcare systems, often penalizing institutions under policies like the Hospital Readmissions Reduction Program (HRRP). Identifying high-risk patients **at or before discharge** allows clinical teams to deploy transition-of-care interventions (e.g., follow-up calls, home health visits, medication reconciliation) to mitigate risk. This project builds a research/hackathon machine learning prototype to predict 30-day readmission risk based on patient demographic, clinical, and history metrics.

---

## 2. Dataset Description
The dataset contains approximately **25,000 patient encounter records** and **17 columns** representing hospital admissions:
* **Target:** `readmitted` (binary classification: 'no' vs. 'yes')
* **Demographics:** `age` (categorical bins like `[70-80)`)
* **Prior Medical History:** `n_outpatient`, `n_inpatient`, `n_emergency` (counts of encounters in the year preceding the current encounter)
* **Clinical Encounters:** `time_in_hospital` (days), `medical_specialty` (admitting specialty)
* **Procedures & Tests:** `n_lab_procedures`, `n_procedures` (other than labs), `glucose_test`, `A1Ctest` (status of lab diagnostic tests)
* **Medications:** `n_medications` (count of generic medications), `change` (diabetic medication change), `diabetes_med` (diabetic medication prescribed)
* **Diagnoses:** `diag_1`, `diag_2`, `diag_3` (ICD-9 mapped disease categories)

---

## 3. Target Definition
The target variable is `readmitted`. Before processing, it consists of two unique string values:
* `"no"` (represents no readmission within 30 days) -> mapped to **`0`**
* `"yes"` (represents readmission within 30 days) -> mapped to **`1`**

---

## 4. Target Distribution
The target variable exhibits a highly balanced distribution:
* **No Readmission (0):** 13,246 rows (**52.98%**)
* **Readmission (1):** 11,754 rows (**47.02%**)
* **Total Patients:** 25,000

---

## 5. Data Quality Analysis
* **Duplicates:** 0 duplicate rows were found in the dataset.
* **Standard Null Values:** No standard NaN or null values are present in the dataset.
* **Implicit Missing Values:** Missing values are represented as string `'Missing'` across categorical columns.

---

## 6. Missing-Value Analysis
The categorical columns contain implicit missing values coded as the string `"Missing"`:
* `medical_specialty`: 12,382 rows (**49.53%**)
* `diag_3`: 196 rows (**0.78%**)
* `diag_2`: 42 rows (**0.17%**)
* `diag_1`: 4 rows (**0.02%**)

These are treated as valid categorical levels by the one-hot encoder since they represent a lack of admitting specialist notation or tertiary diagnosis.

---

## 7. Data Leakage Analysis
The intended prediction point is **at or before patient discharge**. Therefore, features must not contain post-discharge data:
* **Prior Year History:** `n_inpatient`, `n_outpatient`, and `n_emergency` represent visits in the year *preceding* the encounter. These are known at admission, so they are safe.
* **During-Stay Encounters:** `time_in_hospital`, `n_lab_procedures`, `n_procedures`, and medications (`n_medications`, `change`, `diabetes_med`) are finalized at discharge, so they are safe.
* **Diagnoses & Specialties:** `diag_1`, `diag_2`, `diag_3`, and `medical_specialty` are assigned during the stay and known at discharge, so they are safe.
* **Conclusion:** No target leakage features exist in this dataset.

---

## 8. Exploratory Data Analysis
EDA highlights key trends:
* **Prior Admissions vs. Readmission:** Patients with higher `n_inpatient` and `n_emergency` visits in the prior year show a significantly higher readmission rate.
* **Length of Stay:** Longer stays (`time_in_hospital` >= 6 days) are associated with higher readmission probability.
* **Age:** Older patient bins show slightly higher readmission rates, peaking in the `[80-90)` and `[90-100)` cohorts.
* **Diabetes Medication:** Patients prescribed diabetic medication (`diabetes_med` = yes) have a readmission rate of ~49% compared to ~43% for those not on them.

---

## 9. Feature Engineering
No artificial features were fabricated. Categorical features are one-hot encoded to represent indicator flags, and numerical features are scaled using standard normalization.

---

## 10. Preprocessing
The preprocessing pipeline is built in Scikit-learn:
* **Numerical Pipeline:** `SimpleImputer(strategy='median')` -> `StandardScaler()`
* **Categorical Pipeline:** `SimpleImputer(strategy='constant', fill_value='Missing')` -> `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`
* Preprocessor fits *only* on training data (`X_train`) to prevent scale or frequency leaks.

---

## 11. Train/Test Strategy
* **Split:** Stratified 80/20 train/test split.
* **Training Set:** 20,000 samples (80%)
* **Testing Set:** 5,000 samples (20%) - kept completely untouched during CV, tuning, and threshold selection.
* **Random State:** 42

---

## 12. Models Evaluated
Three baseline models were evaluated using Stratified 5-Fold Cross-Validation on the training set:
1. **Logistic Regression (L2 Regularized)**
2. **Random Forest Classifier**
3. **XGBoost Classifier**

---

## 13. Cross-Validation Results
Mean cross-validation metrics across the 5 training folds (threshold = 0.5):

| Model | Accuracy (mean) | Precision (mean) | Recall (mean) | F1 (mean) | ROC-AUC (mean) | PR-AUC (mean) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 0.6095 | **0.6295** | 0.4120 | 0.4979 | 0.6440 | 0.6226 |
| **Random Forest** | 0.6047 | 0.5880 | **0.5326** | **0.5589** | 0.6368 | 0.6054 |
| **XGBoost (Baseline)** | 0.5993 | 0.5853 | 0.5079 | 0.5438 | 0.6339 | 0.6068 |

---

## 14. Hyperparameter Tuning
XGBoost was tuned using Stratified 5-Fold `GridSearchCV` on the training set to optimize F1-score.
* **Best parameters:** `{'colsample_bytree': 1.0, 'learning_rate': 0.1, 'max_depth': 5, 'n_estimators': 150, 'subsample': 1.0}`
* **Tuned XGBoost CV Metrics:**
  * Mean Accuracy: **0.6167**
  * Mean Precision: **0.6141**
  * Mean Recall: **0.4978**
  * Mean F1-Score: **0.5498**
  * Mean ROC-AUC: **0.6542**
  * Mean PR-AUC: **0.6277**

---

## 15. Class Imbalance Analysis
We evaluated class imbalance methods on XGBoost using CV:
1. **No Handling (Default):** Recall 0.5079, Precision 0.5853, F1 0.5438, PR-AUC 0.6068
2. **Class Weighting (`scale_pos_weight = 1.127`):** Recall **0.5687**, Precision 0.5705, F1 **0.5696**, PR-AUC **0.6087**
3. **SMOTE (Oversampling):** Recall 0.5232, Precision 0.5830, F1 0.5515, PR-AUC 0.6067

**Conclusion:** Class Weighting slightly improves F1/Recall. However, since the dataset is highly balanced, the tuned model without artificial balancing yields the most stable calibration.

---

## 16. Threshold Optimization
We evaluated the tuned model's probability predictions on validation folds across thresholds from 0.1 to 0.9:

| Threshold | Recall | Precision | F1 | False Positives (FP) | False Negatives (FN) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 0.1 | 0.9991 | 0.4711 | 0.6403 | 10548 | 8 |
| 0.2 | 0.9915 | 0.4748 | 0.6421 | 10313 | 80 |
| **0.3** | **0.9296** | **0.4968** | **0.6476** | **8852** | **662** |
| 0.4 | 0.7416 | 0.5440 | 0.6276 | 5846 | 2430 |
| 0.5 | 0.4978 | 0.6140 | 0.5498 | 2943 | 4722 |
| 0.6 | 0.2815 | 0.6847 | 0.3990 | 1219 | 6756 |
| 0.7 | 0.1396 | 0.7625 | 0.2360 | 409 | 8090 |
| 0.8 | 0.0574 | 0.8072 | 0.1072 | 129 | 8863 |
| 0.9 | 0.0171 | 0.8703 | 0.0336 | 24 | 9242 |

**Decision:** We selected **0.3** as the decision threshold. It maximizes F1-score (**0.6476**) and achieves a high Recall (**92.96%**), ensuring that patients at risk are caught for preventive action before discharge.

---

## 17. Final Model Selection
We selected the **Tuned XGBoost Classifier** at the **0.3** decision threshold. It provides the best combination of F1-score, Recall, and ROC-AUC stability.

---

## 18. Final Test Results
Evaluating the Tuned XGBoost once on the held-out 20% test set (5,000 samples) at threshold 0.3:
* **Accuracy:** 0.5200
* **Precision:** 0.4945
* **Recall:** **0.9341** (93.4% of actual readmissions caught)
* **F1-Score:** 0.6466
* **ROC-AUC:** 0.6493
* **PR-AUC:** 0.6222

---

## 19. Confusion Matrix (Final Test)
```text
                  Predicted No Readmit    Predicted Readmit
Actual No Readmit        404 (TN)             2245 (FP)
Actual Readmit           155 (FN)             2196 (TP)
```
* High false positives (2,245) reflect the conservative 0.3 threshold optimized for patient-recall sensitivity.

---

## 20. ROC-AUC and 21. PR-AUC
* **ROC-AUC:** 0.6493 (model has moderate discriminative ability)
* **PR-AUC:** 0.6222 (well above baseline random rate of 0.4702)

---

## 22. Precision, 23. Recall, and 24. F1-Score
* **Precision:** 0.4945 (almost half of predicted readmissions are true readmissions)
* **Recall:** 0.9341
* **F1-Score:** 0.6466

---

## 25. SHAP Global Explanation
SHAP beeswarm global analysis identifies the top drivers of readmission:
1. **n_inpatient (Prior Inpatient Admissions):** Pushes risk up. This is the single strongest predictor.
2. **n_emergency (Prior Emergency Visits):** Pushes risk up.
3. **n_lab_procedures (Lab Complexity):** Pushes risk up.
4. **n_medications (Medication Complexity):** Pushes risk up.
5. **time_in_hospital (Length of stay):** Pushes risk up.
6. **medical_specialty (InternalMedicine):** Pushes risk down slightly.

---

## 26. SHAP Patient-Level Explanation
For an individual high-risk patient (e.g., patient index 2813 with 58.8% readmission probability):
* **Risk Category:** HIGH
* **Key Drivers:**
  - `n_inpatient` (9 visits) -> High impact (increases risk)
  - `n_emergency` (7 visits) -> High impact (increases risk)
  - `n_lab_procedures` (48 tests) -> Medium impact (increases risk)
  - `n_medications` (25 meds) -> Medium impact (increases risk)

---

## 27. Model Limitations
* **Moderate Discrimination:** An ROC-AUC of 0.65 suggests the features have limited predictive power for complex clinical outcomes.
* **High False Alarm Rate:** A low decision threshold of 0.3 results in a high number of false positives (2,245 out of 5,000 test cases), which could cause operational alarm fatigue if care transition resources are limited.

---

## 28. Potential Real-World Deployment Challenges
* **Alarm Fatigue:** Flagging ~88% of patients as "High Risk" under a 0.3 threshold makes care management interventions expensive.
* **EHR Integration:** Extracting previous year visit counts (inpatient, outpatient, emergency) dynamically from different electronic health record systems can be logistically challenging at discharge.

---

## 29. Future Improvements
* **Feature Engineering:** Integrate interactions between diagnoses (e.g., comorbidity indices like Charlson Comorbidity Index).
* **Text Mining:** Utilize NLP on discharge summaries and clinical notes to capture social determinants of health.
* **Alternative Algorithms:** Train LightGBM or CatBoost to compare categorical handling.
