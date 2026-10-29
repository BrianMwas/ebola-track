declare module "mapshaper" {
  interface Mapshaper {
    /** Run mapshaper commands on in-memory files; resolves to output files by name. */
    applyCommands(
      commands: string,
      input: Record<string, string>
    ): Promise<Record<string, string | Uint8Array>>
  }
  const mapshaper: Mapshaper
  export default mapshaper
}
