%lex
%%
\s+                                      /* skip whitespace */
[Ff][Ii][Nn][Dd]                        return 'FIND';
[Ww][Hh][Ee][Rr][Ee]                    return 'WHERE';
[Aa][Nn][Dd]                            return 'AND';
[Cc][Oo][Nn][Tt][Aa][Ii][Nn][Ss]        return 'CONTAINS';
">="                                    return 'GTE';
"<="                                    return 'LTE';
"!="                                    return 'NEQ';
">"                                     return 'GT';
"<"                                     return 'LT';
"="                                     return 'EQ';
\"([^\\"]|\\.)*\"                       { yytext = yytext.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\'); return 'STRING'; }
[0-9]+(\.[0-9]+)?                       return 'NUMBER';
[A-Za-z][A-Za-z0-9_]*                   return 'IDENTIFIER';
<<EOF>>                                 return 'EOF';
.                                       return 'INVALID';
/lex

%start query

%%

query
  : FIND collection EOF
      { return { type: 'find', collection: $2, conditions: [] }; }
  | FIND collection WHERE conditions EOF
      { return { type: 'find', collection: $2, conditions: $4 }; }
  ;

collection
  : IDENTIFIER
      { $$ = $1; }
  ;

conditions
  : condition
      { $$ = [$1]; }
  | conditions AND condition
      { $$ = $1.concat([$3]); }
  ;

condition
  : IDENTIFIER operator value
      { $$ = { type: 'condition', field: $1, operator: $2, value: $3 }; }
  ;

operator
  : EQ
      { $$ = '='; }
  | NEQ
      { $$ = '!='; }
  | CONTAINS
      { $$ = 'CONTAINS'; }
  | GT
      { $$ = '>'; }
  | LT
      { $$ = '<'; }
  | GTE
      { $$ = '>='; }
  | LTE
      { $$ = '<='; }
  ;

value
  : STRING
      { $$ = $1; }
  | NUMBER
      { $$ = Number($1); }
  ;
