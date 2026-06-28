declare module 'nspell' {
  interface NSpell {
    correct(word: string): boolean
    suggest(word: string): string[]
  }

  function nspell(aff: string, dic: string): NSpell
  function nspell(dictionary: { aff: string | Buffer; dic: string | Buffer }): NSpell

  export default nspell
}