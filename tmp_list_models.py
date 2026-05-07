import litellm
keys = sorted(litellm.model_cost.keys())
print("=== anything with gpt-5.5-mini / gpt-5-mini ===")
for k in keys:
    if "gpt-5.5-mini" in k or "gpt-5-mini" in k or "gpt-5.5-nano" in k or "gpt-5-nano" in k:
        print(k)
