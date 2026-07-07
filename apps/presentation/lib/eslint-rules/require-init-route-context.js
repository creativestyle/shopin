// Every server-rendered page and layout under app/[variant]/[locale]/ must call
// initRouteContext({ variant, locale }). Under ISR (revalidate=3600 on the layout), each
// segment renders independently — the parent layout may be served from cache without
// re-executing, so children cannot rely on the layout having already set the locale
// (next-intl) or the variant (server BFF data-source routing). initRouteContext sets both
// atomically. The rule fires unconditionally for all non-client route files.
//
// Call-shape requirement: the argument must be an inline object literal with a `variant`
// property whose value is a *dynamic* identifier (i.e. not bound to a string literal). This
// is intentional — it keeps the variant's data-source choice auditable at every call site and
// is what makes the literal-binding check below tractable. Identifier args
// (initRouteContext(ctx)) and spread-assembled objects are rejected by design; the variant
// must be visible in the call expression itself.

/**
 * Walk the scope chain upward and return the first variable named `name`, or null.
 *
 * @param {import('eslint').Scope.Scope} scope
 * @param {string} name
 * @returns {import('eslint').Scope.Variable | null}
 */
function findVariable(scope, name) {
  for (let s = scope; s; s = s.upper) {
    const v = s.variables.find((variable) => variable.name === name)
    if (v) {
      return v
    }
  }
  return null
}

/**
 * Returns true when the variable named `name` is directly initialized from a string literal
 * (e.g. `const variant = 'commercetools-set'`). Destructuring patterns and non-literal
 * initializers return false.
 *
 * Note: multi-hop aliases (`const x = 'y'; const variant = x`) are not detected — they are
 * out of scope for this rule. If that gap needs closing later, make this check recursive on
 * the identifier init.
 *
 * @param {import('eslint').Scope.Scope} scope
 * @param {string} name
 * @returns {boolean}
 */
function isLiteralBound(scope, name) {
  const variable = findVariable(scope, name)
  return Boolean(
    variable?.defs.some(
      (def) =>
        def.type === 'Variable' &&
        def.node.type === 'VariableDeclarator' &&
        def.node.id.type === 'Identifier' &&
        def.node.init?.type === 'Literal'
    )
  )
}

/** @type {import('eslint').Rule.RuleModule} */
const requireInitRouteContext = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require initRouteContext in every server-rendered variant/locale page/layout.',
    },
    messages: {
      missing:
        'Variant/locale route files must call initRouteContext({ variant, locale }). ' +
        'Under ISR each segment may render independently of its parent layout, ' +
        'so every page and layout must initialise both locale (next-intl) and variant ' +
        '(server BFF data-source) for the current render.',
      badCall:
        'initRouteContext must be called with an inline { variant, locale } object literal ' +
        'where variant is an identifier whose value comes from route params, not a string ' +
        'literal. Passing a literal or a variable initialised from a literal silently routes ' +
        'to the wrong data source. Passing an identifier or spread as the argument is also ' +
        'rejected — the variant source must be auditable at the call site.',
    },
  },
  create(context) {
    let sawInitRouteContext = false
    let isClientComponent = false

    return {
      'ExpressionStatement'(node) {
        if (
          node.expression.type === 'Literal' &&
          node.expression.value === 'use client'
        ) {
          isClientComponent = true
        }
      },
      'CallExpression'(node) {
        if (isClientComponent) {
          return
        }
        if (
          node.callee.type !== 'Identifier' ||
          node.callee.name !== 'initRouteContext'
        ) {
          return
        }
        sawInitRouteContext = true

        const arg = node.arguments[0]
        const variantProp =
          arg?.type === 'ObjectExpression'
            ? arg.properties.find(
                (p) =>
                  p.type === 'Property' &&
                  p.key.type === 'Identifier' &&
                  p.key.name === 'variant'
              )
            : undefined

        const variantIsDynamic =
          variantProp?.value.type === 'Identifier' &&
          !isLiteralBound(
            context.sourceCode.getScope(variantProp.value),
            variantProp.value.name
          )

        if (!variantIsDynamic) {
          context.report({ node, messageId: 'badCall' })
        }
      },
      'Program:exit'(node) {
        if (isClientComponent) {
          return
        }
        if (!sawInitRouteContext) {
          context.report({ node, messageId: 'missing' })
        }
      },
    }
  },
}

module.exports = requireInitRouteContext
