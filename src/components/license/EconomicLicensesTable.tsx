'use client';

import { useMemo, useState } from 'react';
import { type EconomicLicense } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterX, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';

type EconomicLicensesTableProps = {
  initialLicenses: EconomicLicense[];
};

export default function EconomicLicensesTable({ initialLicenses }: EconomicLicensesTableProps) {
  const [filter, setFilter] = useState('');

  const filteredLicenses = useMemo(() => {
    return initialLicenses.filter((license) => {
      const searchTerm = filter.toLowerCase();
      return (
        license.taxpayerName?.toLowerCase().includes(searchTerm) ||
        license.taxpayerId?.toLowerCase().includes(searchTerm) ||
        license.licenseNumber?.toLowerCase().includes(searchTerm)
      );
    });
  }, [initialLicenses, filter]);

  const clearFilters = () => {
    setFilter('');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString + 'T00:00:00'), "d MMM yyyy", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Filtrar por contribuyente, RIF o nro. de licencia..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
          <FilterX className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nro. Licencia</TableHead>
              <TableHead>Contribuyente</TableHead>
              <TableHead>RIF</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.length > 0 ? (
              filteredLicenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell className="font-medium">{license.licenseNumber}</TableCell>
                  <TableCell>{license.taxpayerName}</TableCell>
                  <TableCell>{license.taxpayerId}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(license.expirationDate)}</TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ver detalles">
                           <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Detalles de la Licencia: {license.licenseNumber}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh] p-4">
                          <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-primary mb-2">Información del Contribuyente</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <p><strong className="font-medium">C.I./RIF:</strong> {license.taxpayerId}</p>
                                    <p><strong className="font-medium">Contribuyente:</strong> {license.taxpayerName}</p>
                                    <p><strong className="font-medium">Capital:</strong> {formatCurrency(license.capital)} Bs.</p>
                                    <p><strong className="font-medium">Dirección Fiscal:</strong> {license.fiscalAddress}</p>
                                    <p><strong className="font-medium">Nro. Catastro:</strong> {license.cadastreNumber}</p>
                                    <p><strong className="font-medium">Rep. Legal:</strong> {license.legalRepresentative}</p>
                                    <p><strong className="font-medium">C.I. Rep. Legal:</strong> {license.legalRepresentativeId}</p>
                                </div>
                            </div>
                            <hr />
                            <div>
                                <h4 className="font-semibold text-primary mb-2">Información Propietario del Inmueble</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <p><strong className="font-medium">ID Propietario:</strong> {license.propertyOwnerId}</p>
                                    <p><strong className="font-medium">Propietario:</strong> {license.propertyOwnerName}</p>
                                    <p><strong className="font-medium">C.I./RIF:</strong> {license.propertyOwnerCiRif}</p>
                                    <p><strong className="font-medium">ID Inmueble:</strong> {license.propertyId}</p>
                                    <p><strong className="font-medium">Nro. Catastro Inmueble:</strong> {license.propertyCadastreNumber}</p>
                                </div>
                            </div>
                            <hr />
                             <div>
                                <h4 className="font-semibold text-primary mb-2">Vigencia de la Licencia</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <p><strong className="font-medium">Fecha de Emisión:</strong> {formatDate(license.issueDate)}</p>
                                    <p><strong className="font-medium">Fecha de Vencimiento:</strong> {formatDate(license.expirationDate)}</p>
                                </div>
                            </div>
                            <hr />
                            <div>
                                <h4 className="font-semibold text-primary mb-2">Rubros Autorizados</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Código</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Alícuota</TableHead>
                                            <TableHead className="text-right">Mínimo Imputable</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {license.authorizedActivities.map((activity, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{activity.code}</TableCell>
                                            <TableCell>{activity.description}</TableCell>
                                            <TableCell className="text-right">{activity.aliquot}%</TableCell>
                                            <TableCell className="text-right">{formatCurrency(activity.taxableMinimum)} Bs.</TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {license.documents && license.documents.length > 0 && (
                                <>
                                <hr />
                                <div>
                                    <h4 className="font-semibold text-primary mb-2">Documentos Adjuntos</h4>
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {license.documents.map((doc, index) => (
                                          <div key={index} className="relative">
                                            <Image src={doc} alt={`Documento ${index + 1}`} width={200} height={200} className="object-contain rounded-md border" />
                                          </div>
                                      ))}
                                    </div>
                                </div>
                                </>
                            )}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron licencias.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
