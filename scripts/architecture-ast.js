import ts from 'typescript';

/** Collect statically resolvable module references, including re-exports and lazy imports. */
export function moduleSpecifiers(ast) {
  const specs = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier
      && ts.isStringLiteral(node.moduleSpecifier)) specs.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length && (ts.isStringLiteral(node.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))) {
      specs.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return [...new Set(specs)];
}

/** Inspect code tokens rather than comments or unrelated string literals. */
export function usesBrowserStorage(ast) {
  let found = false;
  function visit(node) {
    if (ts.isIdentifier(node) && (node.text === 'localStorage' || node.text === 'sessionStorage')) found = true;
    if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)
      && ['localStorage', 'sessionStorage'].includes(node.argumentExpression.text)) found = true;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(ast);
  return found;
}
