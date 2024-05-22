import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, retry } from 'rxjs';
import { environment } from '../../environments/environment';
import { Region } from '../common/region';
import { Comuna } from '../common/comuna';

@Injectable({
  providedIn: 'root',
})
export class ShopFormService {
  private regionesUrl = `${environment.apiUrl}/regiones`;
  private comunasUrl = `${environment.apiUrl}/comunas`;

  constructor(private httpClient: HttpClient) {}

  getRegionesList(): Observable<Region[]> {
    return this.httpClient
      .get<GetResponseRegiones>(this.regionesUrl)
      .pipe(map((response) => response._embedded.regiones));
  }

  getRegionById(regionId: number): Observable<string> {
    const seachRegionByIdUrl = `${this.regionesUrl}/${regionId}`;
    return this.httpClient
      .get<GetResponseRegion>(seachRegionByIdUrl)
      .pipe(map((response) => response.nombre));
  }
  getComunasListByRegionId(regionID: number): Observable<Comuna[]> {
    const seachComunasByRegionIdUrl = `${this.comunasUrl}/search/findByRegionId?id=${regionID}`;

    console.log(seachComunasByRegionIdUrl);

    return this.httpClient
      .get<GetResponseComunas>(seachComunasByRegionIdUrl)
      .pipe(map((response) => response._embedded.comunas));
  }

  getComunasListByRegionNombre(regionName: string): Observable<Comuna[]> {
    const seachComunasByRegionIdUrl = `${this.comunasUrl}/search/findByRegionNombre?nombre=${regionName}`;

    console.log(seachComunasByRegionIdUrl);

    return this.httpClient
      .get<GetResponseComunas>(seachComunasByRegionIdUrl)
      .pipe(map((response) => response._embedded.comunas));
  }

  getCreditCardMonths(startMonth: number): Observable<number[]> {
    // representa el mes para comenzar el listado
    startMonth = 1;
    return of(
      Array.from({ length: 12 - startMonth + 1 }, (_, i) => startMonth + i)
    );
  }

  getCreditCardYears(): Observable<number[]> {
    const currentYear = new Date().getFullYear();

    return of(Array.from({ length: 15 }, (_, i) => currentYear + i));
  }
}

interface GetResponseRegiones {
  _embedded: {
    regiones: Region[];
  };
}

interface GetResponseRegion {
  nombre: string;
}

interface GetResponseComunas {
  _embedded: {
    comunas: Comuna[];
  };
}
