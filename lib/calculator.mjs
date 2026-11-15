const MAX_EXPRESSION_LENGTH = 200;
const MAX_TOKENS = 100;
const MAX_NESTING = 20;

function fail(message = "Invalid calculator expression.") {
  throw new Error(message);
}

function tokenize(expression) {
  if (typeof expression !== "string") fail("Expression must be text.");
  const source = expression.trim();
  if (!source || source.length > MAX_EXPRESSION_LENGTH) fail("Expression is empty or too long.");

  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if ((char >= "0" && char <= "9") || char === ".") {
      const start = index;
      let digits = 0;
      while (index < source.length && source[index] >= "0" && source[index] <= "9") {
        index += 1;
        digits += 1;
      }
      if (source[index] === ".") {
        index += 1;
        while (index < source.length && source[index] >= "0" && source[index] <= "9") {
          index += 1;
          digits += 1;
        }
      }
      if (digits === 0) fail();
      const value = Number(source.slice(start, index));
      if (!Number.isFinite(value)) fail("Number is outside the supported range.");
      tokens.push({ type: "number", value });
    } else if ("+-*/%()".includes(char)) {
      tokens.push({ type: char, value: char });
      index += 1;
    } else {
      fail("Unsupported character in calculator expression.");
    }

    if (tokens.length > MAX_TOKENS) fail("Expression has too many tokens.");
  }
  return tokens;
}

export function calculateArithmeticExpression(expression) {
  const tokens = tokenize(expression);
  let cursor = 0;

  const peek = () => tokens[cursor];
  const consume = () => tokens[cursor++];
  const checked = (value) => {
    if (!Number.isFinite(value)) fail("Calculation result is outside the supported range.");
    return value;
  };

  function parsePrimary(depth) {
    const token = peek();
    if (!token) fail();
    if (token.type === "number") {
      consume();
      return token.value;
    }
    if (token.type === "(") {
      if (depth >= MAX_NESTING) fail("Expression nesting is too deep.");
      consume();
      const value = parseExpression(depth + 1);
      if (peek()?.type !== ")") fail("Missing closing parenthesis.");
      consume();
      return value;
    }
    fail();
  }

  function parseUnary(depth) {
    if (depth > MAX_NESTING) fail("Expression nesting is too deep.");
    const token = peek();
    if (token?.type === "+" || token?.type === "-") {
      consume();
      const value = parseUnary(depth + 1);
      return token.type === "-" ? checked(-value) : value;
    }
    return parsePrimary(depth);
  }

  function parseTerm(depth) {
    let value = parseUnary(depth);
    while (["*", "/", "%"].includes(peek()?.type)) {
      const operator = consume().type;
      const right = parseUnary(depth);
      if ((operator === "/" || operator === "%") && right === 0) fail("Division by zero is not allowed.");
      if (operator === "*") value = checked(value * right);
      else if (operator === "/") value = checked(value / right);
      else value = checked(value % right);
    }
    return value;
  }

  function parseExpression(depth = 0) {
    let value = parseTerm(depth);
    while (peek()?.type === "+" || peek()?.type === "-") {
      const operator = consume().type;
      const right = parseTerm(depth);
      value = checked(operator === "+" ? value + right : value - right);
    }
    return value;
  }

  const result = parseExpression();
  if (cursor !== tokens.length) fail("Unexpected token in calculator expression.");
  return result;
}
