import asyncio, os, sys
import litellm

async def test(m, **kw):
    try:
        r = await litellm.acompletion(
            model=m,
            messages=[{"role": "user", "content": "Say 'ok' in one word."}],
            **kw,
        )
        print(f"OK  {m}: {r.choices[0].message.content!r}")
    except Exception as e:
        print(f"ERR {m}: {type(e).__name__}: {str(e)[:200]}")

async def main():
    await test("gemini/gemini-3-pro-preview", max_tokens=500)
    await test("gemini/gemini-3-flash-preview", max_tokens=500)

asyncio.run(main())
