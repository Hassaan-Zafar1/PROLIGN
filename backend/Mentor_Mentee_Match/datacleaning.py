import re
import string

import pandas as pd

try:
    import nltk
    from nltk.stem import WordNetLemmatizer
    from nltk.tokenize import word_tokenize

    nltk.download("punkt", quiet=True)
    nltk.download("punkt_tab", quiet=True)
    nltk.download("wordnet", quiet=True)
    nltk.download("omw-1.4", quiet=True)
    LEMMATIZER = WordNetLemmatizer()
except Exception:
    nltk = None
    word_tokenize = None
    LEMMATIZER = None


MENTOR_INPUT = "mentor_dataset.csv"
MENTEE_INPUT = "mentees_dataset.csv"
MENTOR_OUTPUT = "mentor_dataset_cleaned.csv"
MENTEE_OUTPUT = "mentees_dataset_cleaned.csv"

MENTOR_TEXT_COLUMNS = [
    "current_role",
    "industry",
    "domain_tag",
    "bio",
    "tech_skills",
    "domain_skills",
    "soft_skills",
]

MENTEE_TEXT_COLUMNS = [
    "target_role",
    "target_industry",
    "domain_interest",
    "bio",
    "tech_skills",
    "domain_skills",
    "soft_skills",
]


def clean_text(text):
    if pd.isna(text):
        return ""

    text = str(text).lower()
    text = text.replace("/", " ")
    text = text.translate(str.maketrans({char: " " for char in string.punctuation if char not in {"+", "#"}}))
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return ""

    if word_tokenize and LEMMATIZER:
        try:
            tokens = word_tokenize(text)
            tokens = [LEMMATIZER.lemmatize(token) for token in tokens if token.strip()]
            return " ".join(tokens)
        except Exception:
            pass

    return " ".join(re.findall(r"[a-z0-9+#]+", text))


def encode_experience_level(value):
    if pd.isna(value):
        return 0

    text = str(value).strip().lower()
    if not text:
        return 0

    if "entry" in text or "0" in text and "2" in text:
        return 1
    if "mid" in text or "3" in text and "6" in text:
        return 4
    if "senior" in text or "7" in text and "12" in text:
        return 9

    numbers = [int(num) for num in re.findall(r"\d+", text)]
    if numbers:
        return round(sum(numbers) / len(numbers))

    return 0


def add_cleaned_columns(df, columns):
    created = []
    for column in columns:
        if column in df.columns:
            cleaned_column = f"cleaned_{column}"
            df[cleaned_column] = df[column].apply(clean_text)
            created.append(cleaned_column)
    return created


def clean_mentee_record(record: dict) -> dict:
    """
    Apply the same EDA/cleaning logic used for the bulk CSV pipeline to a single
    mentee dict (used for real-time cleaning right after an interview completes).

    Adds cleaned_<column> for each MENTEE_TEXT_COLUMNS field present, plus
    mentee_experience_years derived from experience_level. Does not mutate
    the input dict.
    """
    cleaned = dict(record)
    for column in MENTEE_TEXT_COLUMNS:
        if column in cleaned:
            cleaned[f"cleaned_{column}"] = clean_text(cleaned.get(column, ""))
    cleaned["mentee_experience_years"] = encode_experience_level(cleaned.get("experience_level", ""))
    return cleaned


def clean_mentor_record(record: dict) -> dict:
    """Same as clean_mentee_record but for a single mentor dict."""
    cleaned = dict(record)
    for column in MENTOR_TEXT_COLUMNS:
        if column in cleaned:
            cleaned[f"cleaned_{column}"] = clean_text(cleaned.get(column, ""))
    return cleaned


def main():
    mentor_df = pd.read_csv(MENTOR_INPUT)
    mentee_df = pd.read_csv(MENTEE_INPUT)

    print("=" * 60)
    print("Loaded datasets")
    print("=" * 60)
    print(f"Mentors: {len(mentor_df)} rows")
    print(f"Mentees: {len(mentee_df)} rows")
    print(f"Mentor columns: {list(mentor_df.columns)}")
    print(f"Mentee columns: {list(mentee_df.columns)}")

    mentor_created = add_cleaned_columns(mentor_df, MENTOR_TEXT_COLUMNS)
    mentee_created = add_cleaned_columns(mentee_df, MENTEE_TEXT_COLUMNS)

    if "experience_level" in mentee_df.columns:
        mentee_df["mentee_experience_years"] = mentee_df["experience_level"].apply(encode_experience_level)
    else:
        mentee_df["mentee_experience_years"] = 0

    mentor_df.to_csv(MENTOR_OUTPUT, index=False)
    mentee_df.to_csv(MENTEE_OUTPUT, index=False)

    print()
    print("=" * 60)
    print("Cleaning complete")
    print("=" * 60)
    print(f"Mentor cleaned columns created: {mentor_created}")
    print(f"Mentee cleaned columns created: {mentee_created}")
    print("Created mentee_experience_years")
    print(f"Saved: {MENTOR_OUTPUT}")
    print(f"Saved: {MENTEE_OUTPUT}")


if __name__ == "__main__":
    main()