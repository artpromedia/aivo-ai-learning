import os
import logging
from typing import Optional
import litellm

logger = logging.getLogger("ai-svc.llm_gateway")

litellm.set_verbose = False

MODEL_PRIORITY = [
    "anthropic/claude-sonnet-4-20250514",
    "gemini/gemini-2.0-flash",
    "openai/gpt-4o-mini",
]

COST_PER_1K_TOKENS = {
    "anthropic/claude-sonnet-4-20250514": {"prompt": 0.003, "completion": 0.015},
    "gemini/gemini-2.0-flash": {"prompt": 0.0001, "completion": 0.0004},
    "openai/gpt-4o-mini": {"prompt": 0.00015, "completion": 0.0006},
}


VISION_MODEL_PRIORITY = [
    "gemini/gemini-2.0-flash",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
]


async def generate_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.7,
    max_tokens: int = 2000,
    preferred_model: Optional[str] = None,
    model_chain: Optional[list] = None,
) -> dict:
    if model_chain:
        models_to_try = model_chain
    elif preferred_model:
        models_to_try = [preferred_model] + [m for m in MODEL_PRIORITY if m != preferred_model]
    else:
        models_to_try = MODEL_PRIORITY

    last_error = None
    for model in models_to_try:
        if model is None:
            continue
        try:
            response = await litellm.acompletion(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            content = response.choices[0].message.content
            usage = response.usage

            return {
                "content": content,
                "model": model,
                "prompt_tokens": usage.prompt_tokens if usage else 0,
                "completion_tokens": usage.completion_tokens if usage else 0,
                "total_tokens": (usage.prompt_tokens + usage.completion_tokens) if usage else 0,
                "cost_cents": _calculate_cost(model, usage.prompt_tokens, usage.completion_tokens) if usage else 0,
            }
        except Exception as e:
            logger.warning(f"Model {model} failed: {e}")
            last_error = e
            continue

    raise Exception(f"All models failed. Last error: {last_error}")


async def generate_chat_completion(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 2000,
    preferred_model: Optional[str] = None,
    stream: bool = False,
):
    models_to_try = [preferred_model] + MODEL_PRIORITY if preferred_model else MODEL_PRIORITY

    last_error = None
    for model in models_to_try:
        if model is None:
            continue
        try:
            if stream:
                return litellm.acompletion(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                ), model
            else:
                response = await litellm.acompletion(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                content = response.choices[0].message.content
                usage = response.usage
                return {
                    "content": content,
                    "model": model,
                    "prompt_tokens": usage.prompt_tokens if usage else 0,
                    "completion_tokens": usage.completion_tokens if usage else 0,
                    "total_tokens": (usage.prompt_tokens + usage.completion_tokens) if usage else 0,
                }, model
        except Exception as e:
            logger.warning(f"Model {model} failed: {e}")
            last_error = e
            continue

    raise Exception(f"All models failed. Last error: {last_error}")


def _calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> int:
    costs = COST_PER_1K_TOKENS.get(model, {"prompt": 0.001, "completion": 0.002})
    cost_dollars = (prompt_tokens / 1000 * costs["prompt"]) + (completion_tokens / 1000 * costs["completion"])
    return int(cost_dollars * 100)
