'use client';

import { useMemo, useState } from 'react';
import { type TaxRecord } from '@/types';
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
import { Eye, FilterX } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import Image from 'next/image';
import { Badge } from '../ui/badge';

type TaxRecordsTableProps = {
  initialRecords: TaxRecord[];
};

export default function TaxRecordsTable({ initialRecords }: TaxRecordsTableProps) {
  const [dateFilter, setDateFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');

  const filteredRecords = useMemo(() => {
    return initialRecords.filter((record) => {
      const paymentDate = record.paymentDate || '';
      const description = record.description?.toLowerCase() || '';

      const dateMatch = dateFilter ? paymentDate.includes(dateFilter) : true;
      const descriptionMatch = descriptionFilter
        ? description.includes(descriptionFilter.toLowerCase())
        : true;
      
      return dateMatch && descriptionMatch;
    });
  }, [initialRecords, dateFilter, descriptionFilter]);

  const clearFilters = () => {
    setDateFilter('');
    setDescriptionFilter('');
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
          placeholder="Filtrar por fecha (YYYY-MM-DD)..."
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder="Filtrar por descripción..."
          value={descriptionFilter}
          onChange={(e) => setDescriptionFilter(e.target.value)}
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
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Meses</TableHead>
              <TableHead className="text-right">Monto (€)</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {formatDate(record.paymentDate)}
                  </TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {record.settledMonths?.map(month => (
                        <Badge key={month} variant="secondary">{month}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(record.amountEuros)}</TableCell>
                  <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ver detalles">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalles del Pago</DialogTitle>
                          </DialogHeader>
                           <div className="space-y-4">
                            <p><strong className="font-medium">Fecha:</strong> {formatDate(record.paymentDate)}</p>
                            <p><strong className="font-medium">Descripción:</strong> {record.description}</p>
                            <p><strong className="font-medium">Nro. Recibo:</strong> {record.receiptNumber}</p>
                            <p><strong className="font-medium">Monto (Bs.):</strong> {formatCurrency(record.amountBolivares)}</p>
                            <p><strong className="font-medium">Tasa BCV (€):</strong> {formatCurrency(record.bcvRate)}</p>
                            <p><strong className="font-medium">Monto (€):</strong> {formatCurrency(record.amountEuros)}</p>
                            <div>
                                <strong className="font-medium">Meses liquidados:</strong>
                                <div className="flex flex-wrap gap-2 mt-2">
                                {record.settledMonths?.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
                                </div>
                            </div>
                            {record.document && (
                              <div>
                                <strong className="font-medium">Comprobante:</strong>
                                <div className="mt-2 flex items-center justify-center">
                                  <Image src={record.document} alt="Comprobante" width={400} height={400} className="object-contain rounded-md" />
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
