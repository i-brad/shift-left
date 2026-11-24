# Hints · 06

1. `expect(item).toEqual({ id: expect.any(Number), amount: expect.any(Number), … })` checks shape. `"5000"` is not `expect.any(Number)`.
2. Playwright's `request` keeps cookies. Calling `logInAs(request, 'ada')` again switches who you are.
3. The spec says someone who took no part gets **404**, not 403 and not 200.
4. A plain string in `data` gets JSON-encoded (into a valid JSON string!). To send bytes exactly as written, use a Buffer: `request.post(url, { headers: { 'content-type': 'application/json' }, data: Buffer.from('{ "amount": ') })`.
5. A `500` is never the right answer. If you see one, that's your bug.
