export class Address {
  constructor(
    public street: string,
    public city: string,
    public comuna: string,
    public region: string,
    public zipCode: string
  ) {
    this.street = street;
    this.city = city;
    this.comuna = comuna;
    this.region = region;
    this.zipCode = zipCode;
  }
}
