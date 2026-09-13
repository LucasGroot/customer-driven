from chunker import chunk_by_headings
from pdf_reader import read_words
import os
import pickle
import pandas as pd
from sentence_transformers import SentenceTransformer

def extract_all_chunk_embeddings(folder_path="data/raw/kvaliteket",
                           model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"):
    """
    Extracts all chunks from the PDFs, generates their embeddings and saves them to a .pkl file
    """

    os.makedirs("embeddings", exist_ok=True)

    all_chunks = []

    model = SentenceTransformer(model_name)

    for pdf_file in os.listdir(folder_path):

        # If the file is not a pdf, skip it
        if not pdf_file.endswith(".pdf"):
            continue

        chunks = chunk_by_headings(os.path.join(folder_path, pdf_file))

        for chunk_dict in chunks:
            embedding_for_chunk = model.encode(chunk_dict["text"], normalize_embeddings=True)
            chunk_dict["embedding"] = embedding_for_chunk

        all_chunks.extend(chunks)

    with open("embeddings/chunk_embeddings.pkl", "wb") as file:
        pickle.dump(all_chunks, file)

    return all_chunks

def extract_questions(xlsx_path, sheet, column):
    df = pd.read_excel(xlsx_path, sheet_name=sheet)
    questions = df[column].dropna().astype(str).tolist()
    return questions

def extract_all_question_embeddings(xlsx_path, file_name, sheet, column, 
                    model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"):

    os.makedirs("embeddings", exist_ok=True)

    questions = extract_questions(os.path.join(xlsx_path, file_name), sheet, column)

    model = SentenceTransformer(model_name)

    question_embeddings = model.encode(questions, normalize_embeddings=True)

    question_dicts = [
        {"text": question, "embedding": embedding}
        for question, embedding in zip(questions, question_embeddings)
    ]

    with open("embeddings/question_embeddings.pkl", "wb") as file:
        pickle.dump(question_dicts, file)

    return question_dicts


# In this main block, you can change variables like the model name and paths to the routines and questions
if __name__ == "__main__":
    MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

    KVALITEKET_PATH = "data/raw/kvaliteket"

    QUESTIONS_PATH = "data/raw/questions"
    QUESTION_FILE_NAME = "HR_HMS related questions in ServiceNow january - june 2026.xlsx"
    QUESTIONS_SHEET = 0
    QUESTIONS_COLUMN = "Beskrivelse"

    extract_all_chunk_embeddings(folder_path=KVALITEKET_PATH, 
                                 model_name=MODEL_NAME)
    
    extract_all_question_embeddings(xlsx_path=QUESTIONS_PATH,
                                    file_name=QUESTION_FILE_NAME,
                                    sheet=QUESTIONS_SHEET,
                                    column=QUESTIONS_COLUMN)
    