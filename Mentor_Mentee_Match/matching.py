from matcher import MentorMatcher


if __name__ == "__main__":
    matcher = MentorMatcher()
    sample_id = matcher.mentee_df["mentee_id"].iloc[0]
    result = matcher.match_mentee(sample_id)
    print(result)
