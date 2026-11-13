"""
Asks the language model behind the LiteLLM proxy a question and returns its
JSON answer. The proxy address, key and model name are read from the environment.
"""

import json
import os

import litellm


def ask_llm(system_prompt, prompt):
    """
    Sends the prompt to the model and returns the JSON object it answers with.

    The model is forced into JSON mode, and temperature 0 keeps the answer
    the same when the analysis is run again on the same data.
    """
    response = litellm.completion(
        model=f"litellm_proxy/{os.environ['LITELLM_MODEL']}",
        api_base=os.environ["LITELLM_API_URL"],
        api_key=os.environ["LITELLM_API_KEY"],
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    return json.loads(response.choices[0].message.content.strip())
