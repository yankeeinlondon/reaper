import { Symbol, TypeChecker } from "ts-morph";

export function getClassDefinitionSymbolFromInstance(
  instanceSymbol: Symbol,
  checker: TypeChecker
): Symbol | undefined {
  const decl = instanceSymbol.getDeclarations()[0];
  if (!decl) return undefined;
  const type = checker.getTypeOfSymbolAtLocation(instanceSymbol, decl);
  // For an instance, this is the instance type; getSymbol() gives the class symbol
  return type.getSymbol();
}
