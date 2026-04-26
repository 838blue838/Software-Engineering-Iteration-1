// Detects if a message is a math question and solves it
// Examples: "what is 2+2", "calculate 15 * 7", "5^2 + 3"

function detectMath(content) {
  // Look for math indicators
  const mathKeywords = /\b(calculate|compute|solve|what is|whats|whats|whats|equals)\b/i;
  const mathExpression = /[\d\s\+\-\*\/\^\(\)\.]+[\+\-\*\/\^][\d\s\+\-\*\/\^\(\)\.]+/;

  if (mathKeywords.test(content) || mathExpression.test(content)) {
    // Extract the math expression from the message
    const match = content.match(/[\d\s\+\-\*\/\^\(\)\.]+[\+\-\*\/\^][\d\s\+\-\*\/\^\(\)\.]+/);
    if (match) return match[0].trim();
  }
  return null;
}

function safeEval(expr) {
  // Replace ^ with ** for exponents
  const safeExpr = expr.replace(/\^/g, "**");

  // Only allow numbers, operators, parentheses, decimals, and spaces
  if (!/^[\d\s\+\-\*\/\.\(\)\*]+$/.test(safeExpr)) {
    throw new Error("Invalid math expression");
  }

  // Use Function constructor for safe eval
  return new Function("return " + safeExpr)();
}

function solve(content) {
  const expr = detectMath(content);
  if (!expr) return null;

  try {
    const result = safeEval(expr);
    return {
      expression: expr,
      result: result,
      formatted: `${expr} = ${result}`
    };
  } catch (err) {
    return null;
  }
}

module.exports = { detectMath, solve };