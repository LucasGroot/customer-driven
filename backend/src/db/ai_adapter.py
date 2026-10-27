from datetime import date

NEEDS_REVIEW_BELOW = 0.52  # même seuil que PARTIAL_COVERAGE_FROM dans le front

def run_ai(progress):
    """
    À brancher sur le code de l'IA. progress(n) signale l'étape terminée (1 à 4).
    Doit renvoyer trois listes de tuples :
      routines  : (routine_id, routine_title, routine_date)
      questions : (question_id, question_title, question_date, needs_review)
      matches   : (routine_id, question_id, similarity)   # similarity entre 0 et 1
    """
    raise NotImplementedError("IA pas encore branchée")