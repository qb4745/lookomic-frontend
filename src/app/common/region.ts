export class Region {
  constructor(
    public id: number,
    public nombre: string,
    public regionIso31662: string,
    public capitalRegional: string
  ) {
    this.id = id;
    this.nombre = nombre;
    this.regionIso31662 = regionIso31662;
    this.capitalRegional = capitalRegional;
  }
}
