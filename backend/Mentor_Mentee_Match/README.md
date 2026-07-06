# Mentor-Mentee Matching and Skill Gap Recommendation System

This project is a deterministic Information Retrieval / recommendation ranking system. It matches each mentee to the best available mentors, then recommends missing skills by comparing the mentee with the top matched mentors.

The final pipeline does not use XGBoost. The old `Train_model.py` and `mentor_matcher_model.pkl` are deprecated because the previous model learned synthetic labels created from the same retrieval formula used as a feature. The production path is now explainable and follows the internship scoring requirements directly.

## Main Files

- `datacleaning.py` loads raw CSV files, cleans useful text columns, encodes mentee experience, and saves cleaned CSVs.
- `matcher.py` contains the `MentorMatcher` class for recovery, retrieval, ranking, and skill-gap recommendations.
- `app.py` is a simple command-line report for one mentee.
- `requirements.txt` lists the final dependencies.

## Dataset Columns

Mentors are expected to include columns such as `mentor_id`, `full_name`, `current_role`, `industry`, `domain_tag`, `bio`, `experience_years`, `avg_rating`, `total_sessions`, `tech_skills`, `domain_skills`, and `soft_skills`.

Mentees are expected to include columns such as `mentee_id`, `full_name`, `target_role`, `target_company_tier`, `target_industry`, `domain_interest`, `bio`, `experience_level`, `tech_skills`, `domain_skills`, and `soft_skills`.

The code handles missing optional columns gracefully where possible.

## Matching Logic

The matcher uses `SentenceTransformer("all-MiniLM-L6-v2")` and cosine similarity for semantic matching:

- Role: mentor `current_role` vs mentee `target_role`
- Industry: mentor `industry` vs mentee `target_industry + target_company_tier`
- Domain: mentor `domain_tag` vs mentee `domain_interest`

Initial retrieval score:

```text
retrieval_score = 0.4 * role_score + 0.3 * industry_score + 0.3 * domain_score
```

## Bio Recovery

If important matching fields are missing, blank, or null, `matcher.py` recovers values from the bio using keyword dictionaries:

- Mentor: `current_role`, `industry`, `domain_tag`
- Mentee: `target_role`, `target_industry`, `domain_interest`

Recovered values are stored in matching-specific columns such as `match_current_role` and `match_target_role`, so original raw columns are preserved.

## Experience Filter

No mentor is returned unless:

```text
mentor.experience_years >= mentee_experience_years
```

Mentee text experience levels are mapped as:

- Entry level (0-2 yrs) -> 1
- Mid-level (3-6 yrs) -> 4
- Senior (7-12 yrs) -> 9

## Quality Re-ranking

After retrieval and experience filtering, mentors are re-ranked with normalized rating and session counts:

```text
final_score = 0.7 * retrieval_score + 0.2 * rating_norm + 0.1 * sessions_norm
```

The top 5 mentors are returned by descending `final_score`.

## Skill Gap Recommendations

For each of the top 5 mentors, the system compares:

- `tech_skills`
- `domain_skills`
- `soft_skills`

Missing mentor skills are counted across the top mentors. Skills found in more matched mentors are recommended first, with alphabetical ordering as a tie-breaker.

## How to Run

Install requirements:

```bash
pip install -r requirements.txt
```

Clean the raw datasets:

```bash
python datacleaning.py
```

Run the matching demo:

```bash
python app.py
```

Press Enter in `app.py` to use the first mentee, or type a specific `mentee_id`.
