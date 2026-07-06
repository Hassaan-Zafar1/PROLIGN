# Mentor-Mentee Matching Project: Changes and Run Guide

This document explains all major changes made to the mentor-mentee matching project, where those changes were made, why they were made, how to run the project, and how to verify each internship requirement from the output.

## 1. Project Summary

The project was converted from an experimental supervised ML pipeline into a deterministic Information Retrieval / Recommendation Ranking System.

The final system:

- Loads mentor and mentee CSV files.
- Cleans useful text columns.
- Recovers missing role, industry, and domain fields from bios.
- Uses semantic similarity with `SentenceTransformer("all-MiniLM-L6-v2")`.
- Scores mentor-mentee compatibility using role, industry/company tier, and domain similarity.
- Filters out mentors with less experience than the mentee.
- Re-ranks mentors using rating and total sessions.
- Returns the top 5 mentors.
- Generates frequency-ranked skill-gap recommendations from the top matched mentors.

The final production pipeline does not use XGBoost.

## 2. Files Changed or Added

### `datacleaning.py`

Purpose:

- Loads raw CSV files:
  - `mentor_dataset.csv`
  - `mentees_dataset.csv`
- Cleans important text columns.
- Creates cleaned versions of role, industry, domain, bio, and skills columns.
- Encodes mentee experience levels into numeric values.
- Saves:
  - `mentor_dataset_cleaned.csv`
  - `mentees_dataset_cleaned.csv`

Important functions added:

- `clean_text(text)`
- `encode_experience_level(value)`
- `add_cleaned_columns(df, columns)`
- `main()`

How it satisfies requirements:

- Handles null values safely.
- Lowercases text.
- Removes punctuation carefully.
- Tokenizes and lemmatizes when NLTK is installed.
- Falls back to regex cleaning if NLTK is unavailable.
- Creates cleaned columns such as:
  - `cleaned_current_role`
  - `cleaned_industry`
  - `cleaned_domain_tag`
  - `cleaned_bio`
  - `cleaned_tech_skills`
  - `cleaned_domain_skills`
  - `cleaned_soft_skills`
  - `cleaned_target_role`
  - `cleaned_target_industry`
  - `cleaned_domain_interest`

Experience mapping:

```text
Entry level (0-2 yrs) -> 1
Mid-level (3-6 yrs) -> 4
Senior (7-12 yrs) -> 9
```

Additional or slightly different experience values are handled gracefully by looking for numbers in the text.

### `matcher.py`

Purpose:

This is the main production matching engine.

It contains the class:

```python
MentorMatcher
```

Main responsibilities:

- Loads cleaned mentor and mentee datasets.
- Recovers missing fields from bio.
- Loads `SentenceTransformer("all-MiniLM-L6-v2")`.
- Precomputes mentor embeddings.
- Computes role, industry, and domain semantic similarity scores.
- Applies experience filtering.
- Applies rating/session quality re-ranking.
- Returns top 5 mentors.
- Generates skill-gap recommendations.
- Returns structured dictionary output through `match_mentee()`.

Important dictionaries added:

- `ROLE_MAP`
- `INDUSTRY_MAP`
- `DOMAIN_MAP`

Important functions added:

- `infer_from_bio(bio, field_map)`
- `recover_missing_value(row, column, bio_column, field_map)`
- `parse_skills(skill_str)`
- `min_max_normalize(series)`

Important class methods:

- `compute_scores_for_mentee(mentee_row)`
- `filter_by_experience(scored_df, mentee_exp)`
- `get_top_mentors(mentee_id, top_k=5)`
- `get_skill_gap_recommendations(mentee_id, top_mentors_df)`
- `match_mentee(mentee_id, top_k=5)`

How it satisfies requirements:

- Uses semantic similarity for role matching.
- Uses semantic similarity for industry matching.
- Combines mentee `target_industry` and `target_company_tier`.
- Uses semantic similarity for domain matching.
- Uses the required retrieval score formula.
- Filters mentors by experience.
- Normalizes rating and sessions.
- Uses the required final score formula.
- Returns ranked top mentors.
- Computes frequency-ranked skill gaps.
- Preserves original columns by creating matching-specific recovered columns.

Recovered mentor columns:

```text
match_current_role
match_industry
match_domain_tag
```

Recovered mentee columns:

```text
match_target_role
match_target_industry
match_domain_interest
```

### `app.py`

Purpose:

A simple runnable command-line app for testing the project.

What it does:

- Instantiates `MentorMatcher`.
- Shows sample mentee IDs.
- Asks the user to enter a `mentee_id`.
- Uses the first mentee if the user presses Enter.
- Prints:
  - Mentee profile
  - Top 5 matched mentors
  - Skill gap recommendations

The output is designed to make requirement checking easy.

### `requirements.txt`

Purpose:

Lists final project dependencies.

Contents:

```text
pandas
numpy
nltk
sentence-transformers
scikit-learn
torch
```

XGBoost is intentionally not included because the final pipeline does not depend on it.

### `README.md`

Purpose:

Explains:

- Project purpose.
- Dataset columns.
- Matching logic.
- Scoring formulas.
- Bio recovery.
- Experience filtering.
- Skill-gap recommendation logic.
- How to run the project.
- Why XGBoost was removed from the final production path.

### `matching.py`

Purpose:

Kept as a small compatibility wrapper.

The old script-style implementation was replaced. The file now imports and uses `MentorMatcher` from `matcher.py`.

### `Train_model.py`

Status:

Deprecated.

A deprecation note was added at the top of the file.

Why it is deprecated:

The previous XGBoost model created synthetic labels from the same retrieval score that was also used as an input feature. This means the model was only learning to imitate the scoring formula, not learning real mentor-mentee compatibility.

The final system does not use:

- `Train_model.py`
- `mentor_matcher_model.pkl`

## 3. Why XGBoost Was Removed

The internship requirements describe a clear retrieval and ranking system, not a supervised classification problem.

The previous XGBoost approach was removed from the final path because:

- It used artificial labels.
- The labels came from the same hand-written scoring formula used in the features.
- It did not add real learning or real compatibility intelligence.
- The labeling logic was flawed because it used accumulated rows instead of only the current mentee's candidate mentor rows.
- It made the project harder to explain and evaluate.

The new deterministic system is:

- Explainable.
- Easier to debug.
- Aligned with the internship requirements.
- Reproducible.
- Directly connected to the required formulas.

## 4. Matching and Ranking Formulas

### Role Score

Mentor column:

```text
current_role
```

Mentee column:

```text
target_role
```

Matching method:

```text
SentenceTransformer("all-MiniLM-L6-v2") + cosine similarity
```

This allows similar roles such as `Frontend Engineer` and `Frontend Developer` to match semantically.

### Industry Score

Mentor column:

```text
industry
```

Mentee columns:

```text
target_industry
target_company_tier
```

The mentee matching text is built as:

```text
target_industry + " " + target_company_tier
```

This satisfies the requirement that mentor industry is matched against both the mentee's target industry and company tier.

### Domain Score

Mentor column:

```text
domain_tag
```

Mentee column:

```text
domain_interest
```

Matching method:

```text
SentenceTransformer("all-MiniLM-L6-v2") + cosine similarity
```

### Retrieval Score

Formula:

```text
retrieval_score =
0.4 * role_score +
0.3 * industry_score +
0.3 * domain_score
```

Reason:

- Role is slightly more important.
- Industry/company tier and domain are still major matching signals.

### Experience Filter

Formula:

```text
mentor.experience_years >= mentee_experience_years
```

Any mentor with less experience than the mentee is removed before final ranking.

### Quality Re-ranking

Mentor quality is added after retrieval and experience filtering.

The system normalizes:

```text
avg_rating
total_sessions
```

Then computes:

```text
final_score =
0.7 * retrieval_score +
0.2 * rating_norm +
0.1 * sessions_norm
```

Reason:

- Semantic relevance remains the main factor.
- Stronger mentor rating and activity push mentors upward.

## 5. Skill Gap Recommendation Logic

The system compares each mentee with the top matched mentors.

Skill columns:

```text
tech_skills
domain_skills
soft_skills
```

For each top mentor:

```text
missing_skills = mentor_skills - mentee_skills
```

Then the system counts how often each missing skill appears across the top mentors.

Example:

```text
Python found in 4/5 matched mentors
Docker found in 2/5 matched mentors
```

Skills are sorted by:

1. Higher frequency first.
2. Alphabetical order as a tie-breaker.

The final output includes:

- Recommended Tech Skills
- Recommended Domain Skills
- Recommended Soft Skills

## 6. Bio Recovery Logic

If an important field is missing, empty, blank, `nan`, `none`, or `null`, the system tries to infer it from the bio.

Mentor fields recovered:

```text
current_role
industry
domain_tag
```

Mentee fields recovered:

```text
target_role
target_industry
domain_interest
```

The recovery system uses:

- Cleaned bio text.
- Keyword maps:
  - `ROLE_MAP`
  - `INDUSTRY_MAP`
  - `DOMAIN_MAP`

Example:

If a bio contains:

```text
NLP, machine learning, deep learning
```

Then the system can infer:

```text
domain_tag = ai-ml
```

If nothing can be inferred, the system returns:

```text
general
```

## 7. How to Run the Project

### Step 1: Open Terminal in the Project Folder

In PowerShell or Command Prompt:

```powershell
cd "C:\Users\pakistanbusiness.biz\Desktop\dataset"
```

### Step 2: Install Requirements

Try:

```powershell
pip install -r requirements.txt
```

If `pip` or `python` is not recognized, try:

```powershell
py -m pip install -r requirements.txt
```

### Step 3: Clean the Datasets

Run:

```powershell
python datacleaning.py
```

or:

```powershell
py datacleaning.py
```

Expected output:

```text
Loaded datasets
Mentors: 1000 rows
Mentees: 1000 rows
Mentor columns: [...]
Mentee columns: [...]
Cleaning complete
Mentor cleaned columns created: [...]
Mentee cleaned columns created: [...]
Created mentee_experience_years
Saved: mentor_dataset_cleaned.csv
Saved: mentees_dataset_cleaned.csv
```

### Step 4: Run the Matching App

Run:

```powershell
python app.py
```

or:

```powershell
py app.py
```

The app will show sample mentee IDs.

You can:

- Press Enter to use the first mentee.
- Type a specific `mentee_id` and press Enter.

Expected output sections:

```text
MENTEE PROFILE
TOP 5 MATCHED MENTORS
SKILL GAP RECOMMENDATIONS
```

## 8. How to Check Each Requirement from the Output

### Requirement 1: Role Matching

Look inside:

```text
TOP 5 MATCHED MENTORS
```

Each mentor prints:

```text
Role Score:
```

This verifies semantic role matching between:

```text
mentor.current_role
mentee.target_role
```

### Requirement 2: Industry / Company Tier Matching

Each mentor prints:

```text
Industry Score:
```

This verifies matching between:

```text
mentor.industry
```

and:

```text
mentee.target_industry + " " + mentee.target_company_tier
```

### Requirement 3: Domain Matching

Each mentor prints:

```text
Domain Score:
```

This verifies semantic matching between:

```text
mentor.domain_tag
mentee.domain_interest
```

### Requirement 4: Initial Retrieval Score

Each mentor prints:

```text
Retrieval Score:
```

Check that the value follows:

```text
0.4 * Role Score + 0.3 * Industry Score + 0.3 * Domain Score
```

### Requirement 5: Experience Filter

In the mentee profile, check:

```text
Experience: ... (X yrs)
```

For every mentor, check:

```text
Experience: Y yrs
```

Every returned mentor should satisfy:

```text
Y >= X
```

If a mentor has less experience than the mentee, that mentor should not appear in the top results.

### Requirement 6: Quality Re-ranking

Each mentor prints:

```text
Rating:
Sessions:
Final Score:
```

This confirms the final ranking includes:

```text
avg_rating
total_sessions
```

Final formula:

```text
0.7 * retrieval_score + 0.2 * rating_norm + 0.1 * sessions_norm
```

### Requirement 7: Top 5 Mentors

Check the ranked list:

```text
1.
2.
3.
4.
5.
```

The mentors should be sorted by:

```text
Final Score descending
```

If fewer than 5 mentors pass the experience filter, the app safely returns fewer mentors.

### Requirement 8: Skill Gap Analysis

Look at:

```text
SKILL GAP RECOMMENDATIONS
```

You should see:

```text
Recommended Tech Skills:
Recommended Domain Skills:
Recommended Soft Skills:
```

Each skill appears with frequency:

```text
Skill Name - found in N/5 matched mentors
```

This verifies the system ranks missing skills by how often they appear across the top matched mentors.

### Requirement 9: Bio Recovery System

Bio recovery runs automatically in `matcher.py`.

To manually test it:

1. Open one raw CSV file.
2. Blank out a matching field such as:
   - mentor `domain_tag`
   - mentor `industry`
   - mentor `current_role`
   - mentee `domain_interest`
   - mentee `target_industry`
   - mentee `target_role`
3. Make sure the bio contains useful keywords such as:
   - `machine learning`
   - `NLP`
   - `AWS`
   - `frontend`
   - `finance`
4. Run:

```powershell
python datacleaning.py
python app.py
```

The matcher should recover a matching value internally in columns such as:

```text
match_domain_tag
match_target_industry
match_current_role
```

### Requirement 10: Data Cleaning

Run:

```powershell
python datacleaning.py
```

Then open:

```text
mentor_dataset_cleaned.csv
mentees_dataset_cleaned.csv
```

Check that cleaned columns exist.

Mentor cleaned columns:

```text
cleaned_current_role
cleaned_industry
cleaned_domain_tag
cleaned_bio
cleaned_tech_skills
cleaned_domain_skills
cleaned_soft_skills
```

Mentee cleaned columns:

```text
cleaned_target_role
cleaned_target_industry
cleaned_domain_interest
cleaned_bio
cleaned_tech_skills
cleaned_domain_skills
cleaned_soft_skills
```

Also check:

```text
mentee_experience_years
```

### Requirement 11: Structured `match_mentee` Output

This is implemented in:

```text
matcher.py
```

Method:

```python
match_mentee(mentee_id, top_k=5)
```

It returns:

```python
{
    "mentee": {...},
    "top_mentors": [...],
    "skill_recommendations": {
        "tech_skills": [...],
        "domain_skills": [...],
        "soft_skills": [...]
    }
}
```

### Requirement 12: Runnable App

This is implemented in:

```text
app.py
```

Run:

```powershell
python app.py
```

The app prints a readable report with:

- Mentee profile
- Top 5 matched mentors
- Skill-gap recommendations

### Requirement 13: README

This is implemented in:

```text
README.md
```

It explains the project purpose, formulas, recovery logic, skill-gap logic, and run steps.

### Requirement 14: Testing

The following checks were performed:

- `datacleaning.py` runs successfully.
- `app.py` runs successfully.
- Syntax check passed for:
  - `datacleaning.py`
  - `matcher.py`
  - `matching.py`
  - `app.py`
  - `Train_model.py`
- First mentee test passed.
- Senior mentee experience-filter test passed.
- Empty skill parsing test passed.
- Mixed delimiter skill parsing test passed.

## 9. Quick Evaluation Checklist

Use this checklist when presenting or submitting the project.

```text
[ ] Run pip install -r requirements.txt
[ ] Run python datacleaning.py
[ ] Confirm cleaned CSV files are created
[ ] Confirm cleaned columns exist
[ ] Confirm mentee_experience_years exists
[ ] Run python app.py
[ ] Confirm MENTEE PROFILE appears
[ ] Confirm TOP 5 MATCHED MENTORS appears
[ ] Confirm Role Score appears
[ ] Confirm Industry Score appears
[ ] Confirm Domain Score appears
[ ] Confirm Retrieval Score appears
[ ] Confirm Final Score appears
[ ] Confirm mentor experience >= mentee experience
[ ] Confirm skill recommendations show N/5 frequency
[ ] Confirm Train_model.py is not used in the final pipeline
```

## 10. Optional Developer Test Commands

To test the matcher directly:

```powershell
python -c "from matcher import MentorMatcher; m=MentorMatcher(); print(m.match_mentee(m.mentee_df['mentee_id'].iloc[0]))"
```

To check Python syntax:

```powershell
python -m py_compile datacleaning.py matcher.py matching.py app.py Train_model.py
```

To test a specific mentee:

```powershell
python app.py
```

Then paste a `mentee_id` shown by the app.

## 11. Final Production Path

The final pipeline is:

```text
mentor_dataset.csv + mentees_dataset.csv
        |
        v
datacleaning.py
        |
        v
mentor_dataset_cleaned.csv + mentees_dataset_cleaned.csv
        |
        v
matcher.py / MentorMatcher
        |
        v
app.py report
```

Files not used in the final production path:

```text
Train_model.py
mentor_matcher_model.pkl
```

These are kept only as deprecated experimental artifacts.

