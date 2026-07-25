from matcher import MentorMatcher


def format_score(value):
    try:
        return f"{float(value):.4f}"
    except Exception:
        return "0.0000"


def print_recommendations(title, recommendations):
    print(title)
    if not recommendations:
        print("- None")
        return
    for item in recommendations:
        skill = str(item["skill"]).title()
        print(f"- {skill} - found in {item['count']}/{item['out_of']} matched mentors")


def print_report(result):
    mentee = result["mentee"]

    print("=" * 60)
    print("MENTEE PROFILE")
    print("=" * 60)
    print(f"Name: {mentee.get('full_name', '')}")
    print(f"Target Role: {mentee.get('target_role', '')}")
    print(f"Target Industry: {mentee.get('target_industry', '')}")
    print(f"Target Company Tier: {mentee.get('target_company_tier', '')}")
    print(f"Domain Interest: {mentee.get('domain_interest', '')}")
    print(f"Experience: {mentee.get('experience_level', '')} ({mentee.get('mentee_experience_years', 0)} yrs)")

    print()
    print("=" * 60)
    print("TOP 5 MATCHED MENTORS")
    print("=" * 60)
    if not result["top_mentors"]:
        print("No mentors passed the experience filter.")
    for mentor in result["top_mentors"]:
        print(f"{mentor.get('rank')}. {mentor.get('full_name', '')}")
        print(f"   Role: {mentor.get('current_role', '')}")
        print(f"   Industry: {mentor.get('industry', '')}")
        print(f"   Domain: {mentor.get('domain_tag', '')}")
        print(f"   Experience: {mentor.get('experience_years', 0)} yrs")
        print(f"   Rating: {mentor.get('avg_rating', 0)}")
        print(f"   Sessions: {mentor.get('total_sessions', 0)}")
        print(f"   Role Score: {format_score(mentor.get('role_score', 0))}")
        print(f"   Industry Score: {format_score(mentor.get('industry_score', 0))}")
        print(f"   Domain Score: {format_score(mentor.get('domain_score', 0))}")
        print(f"   Retrieval Score: {format_score(mentor.get('retrieval_score', 0))}")
        print(f"   Final Score: {format_score(mentor.get('final_score', 0))}")
        print()

    print("=" * 60)
    print("SKILL GAP RECOMMENDATIONS")
    print("=" * 60)
    recommendations = result["skill_recommendations"]
    print_recommendations("Recommended Tech Skills:", recommendations.get("tech_skills", []))
    print()
    print_recommendations("Recommended Domain Skills:", recommendations.get("domain_skills", []))
    print()
    print_recommendations("Recommended Soft Skills:", recommendations.get("soft_skills", []))


def main():
    matcher = MentorMatcher()
    sample_ids = matcher.mentee_df["mentee_id"].head(10).astype(str).tolist()

    print("Available sample mentee IDs:")
    print(", ".join(sample_ids))
    selected_id = input("Enter mentee_id, or press Enter to use the first mentee: ").strip()
    if not selected_id:
        selected_id = sample_ids[0]

    result = matcher.match_mentee(selected_id, top_k=5)
    print_report(result)


if __name__ == "__main__":
    main()
