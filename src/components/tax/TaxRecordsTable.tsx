'use client';

import { useMemo, useState } from 'react';
import { type TaxRecord, type Settings } from '@/types';
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
import { Eye, FilterX, Pencil, Trash2, FileDown, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import TaxForm from './TaxForm';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { useAuth, useUserRole } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


type TaxRecordsTableProps = {
  initialRecords: TaxRecord[];
  isLoading: boolean;
};

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

function DocumentPreviewDialog({ src }: { src: string }) {
    const [open, setOpen] = useState(false);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = `comprobante-${new Date().toISOString()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="relative w-full h-full">
                    <Image src={src} alt="Comprobante" width={200} height={200} className="object-contain rounded-md border w-full h-full" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-5/6 flex flex-col">
                <DialogHeader>
                    <DialogTitle>Vista Previa del Comprobante</DialogTitle>
                </DialogHeader>
                <div className="flex-grow relative my-4">
                    <Image src={src} alt="Vista previa completa" fill style={{ objectFit: 'contain' }} />
                </div>
                 <Button onClick={handleDownload} className="self-end">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default function TaxRecordsTable({ initialRecords, isLoading }: TaxRecordsTableProps) {
  const [dateFilter, setDateFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [editingRecord, setEditingRecord] = useState<TaxRecord | null>(null);
  const { toast } = useToast();
  const user = useAuth();
  const userRole = useUserRole();
  const { firestore } = initializeFirebase();

  const userIdToUse = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);

  const settingsRef = useMemo(() => {
    if (!userIdToUse) return null;
    return doc(firestore, `users/${userIdToUse}/settings/general`);
  }, [userIdToUse, firestore]);

  const { data: settings } = useDoc<Settings>(settingsRef);
  const companyName = settings?.companyName || 'Mi Empresa';
  const logoUrl = settings?.logoUrl;

  const filteredRecords = useMemo(() => {
    return (initialRecords || []).filter((record) => {
      const paymentDate = record.paymentDate || '';
      const description = record.description?.toLowerCase() || '';

      const dateMatch = dateFilter ? paymentDate.includes(dateFilter) : true;
      const descriptionMatch = descriptionFilter
        ? description.includes(descriptionFilter.toLowerCase())
        : true;
      
      return dateMatch && descriptionMatch;
    });
  }, [initialRecords, dateFilter, descriptionFilter]);
  
  const handleDelete = async (id: string) => {
    if (!userIdToUse) return;
    
    const recordRef = doc(firestore, `users/${userIdToUse}/taxRecords`, id);

    try {
        deleteDocumentNonBlocking(recordRef);
        toast({
            title: 'Éxito',
            description: 'Registro eliminado con éxito.',
        });
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar el registro.',
        });
    }
  };


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

  const handleEditSuccess = () => {
    setEditingRecord(null);
  };
  
  const addHeaderToPDF = (doc: jsPDF, title: string) => {
    const emissionDate = format(new Date(), "d MMM yyyy, HH:mm:ss", { locale: es });
    
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = logoUrl;
        doc.addImage(logoUrl, 'PNG', 14, 12, 20, 20);
      } catch (e) {
        console.error("Error loading logo for PDF", e);
      }
    }
    
    doc.setFontSize(18);
    doc.text(companyName, logoUrl ? 40 : 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(title, logoUrl ? 40 : 14, 28);
    doc.text(`Emitido: ${emissionDate}`, doc.internal.pageSize.getWidth() - 14, 28, { align: 'right' });
  };


  const exportToPDF = (record: TaxRecord) => {
    const doc = new jsPDF();
    const reportTitle = `Detalle del Pago de Impuesto - Recibo ${record.receiptNumber}`;
    addHeaderToPDF(doc, reportTitle);

    const tableBody = [
        ['Fecha', formatDate(record.paymentDate)],
        ['Descripción', record.description],
        ['Categoría', record.category],
        ['Nro. Recibo', record.receiptNumber],
        ['Monto (Bs.)', formatCurrency(record.amountBolivares)],
        ['Tasa BCV (€)', formatCurrency(record.bcvRate)],
        ['Monto (€)', formatCurrency(record.amountEuros)],
        ['Meses liquidados', record.settledMonths.join(', ')],
    ];

    doc.autoTable({
        startY: 40,
        body: tableBody,
        theme: 'grid'
    });
    
    doc.save(`pago_impuesto_${record.receiptNumber}.pdf`);
  };


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
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                       <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                </TableRow>
            ) : filteredRecords.length > 0 ? (
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
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Detalles del Pago</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[70vh] p-4">
                           <div className="space-y-4">
                            <p><strong className="font-medium">Fecha:</strong> {formatDate(record.paymentDate)}</p>
                            <p><strong className="font-medium">Descripción:</strong> {record.description}</p>
                             <p><strong className="font-medium">Categoría:</strong> <Badge variant="outline">{record.category}</Badge></p>
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
                            {record.documents && record.documents.length > 0 && (
                              <div>
                                <strong className="font-medium">Comprobantes:</strong>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {record.documents.map((doc, index) => (
                                      <div key={index} className="relative aspect-square">
                                          <DocumentPreviewDialog src={doc} />
                                      </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <Button variant="ghost" size="icon" aria-label="Editar registro" onClick={() => setEditingRecord(record)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Exportar a PDF" onClick={() => exportToPDF(record)}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                       <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Eliminar registro">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de impuesto.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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

       {editingRecord && (
        <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Pago de Impuesto</DialogTitle>
            </DialogHeader>
             <ScrollArea className="max-h-[70vh] p-4">
              <TaxForm isEditMode initialData={editingRecord} onSuccess={handleEditSuccess} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
