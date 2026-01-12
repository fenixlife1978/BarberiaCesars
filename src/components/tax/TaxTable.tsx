'use client';

import { useMemo, useState } from 'react';
import { type Settings, type TaxRecord } from '@/types';
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
import { FilterX, FileDown, Trash2, Loader2, Eye, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { initializeFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import TaxForm from './TaxForm';
import { ScrollArea } from '../ui/scroll-area';

interface TaxTableProps {
  records: TaxRecord[]; 
  isLoading: boolean;
}

export default function TaxTable({ records = [], isLoading }: TaxTableProps) {
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const { firestore } = initializeFirebase();
  const [editingRecord, setEditingRecord] = useState<TaxRecord | null>(null);

  // Settings de la empresa (Ruta corregida a default-user)
  const { data: settings } = useDoc<Settings>(doc(firestore, `users/default-user/settings/general`));

  const filteredRecords = useMemo(() => {
    return records.filter((rec) =>
      rec.description?.toLowerCase().includes(filter.toLowerCase()) ||
      rec.receiptNumber?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [records, filter]);

  const handleDelete = async (id: string) => {
    try {
      // RUTA CORREGIDA A DEFAULT-USER
      const ref = doc(firestore, `users/default-user/taxRecords`, id);
      deleteDocumentNonBlocking(ref);
      toast({ title: 'Éxito', description: 'Registro eliminado de la base de datos central.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Error de permisos o conexión.' });
    }
  };

  const handleEditSuccess = () => {
    setEditingRecord(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(amount);
  };

  const exportPDF = (record: TaxRecord) => {
    const doc = new jsPDF();
    if (settings?.logoUrl) {
        try {
            doc.addImage(settings.logoUrl, 'PNG', 14, 10, 25, 25);
        } catch (e) { console.error(e); }
    }
    
    doc.setFontSize(16);
    doc.text("COMPROBANTE DE PAGO DE IMPUESTOS", 45, 20);
    
    (doc as any).autoTable({
      startY: 40,
      body: [
        ['Descripción/Contribuyente', record.description],
        ['Nro. Recibo', record.receiptNumber],
        ['Fecha de Pago', record.paymentDate],
        ['Monto Bolívares', `${formatCurrency(record.amountBolivares)} Bs.`],
        ['Tasa BCV', `${formatCurrency(record.bcvRate)} Bs/€`],
        ['Monto Euros', `${formatCurrency(record.amountEuros)} €`],
        ['Meses Liquidados', record.settledMonths.join(', ')]
      ],
      theme: 'grid',
      styles: { cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });
    
    doc.save(`Recibo_${record.receiptNumber || 'Impuesto'}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input 
          placeholder="Buscar por descripción o recibo..." 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          className="max-w-sm" 
        />
        <Button variant="outline" onClick={() => setFilter('')}>
          <FilterX className="h-4 w-4 mr-2" /> Limpiar
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead>Descripción / Recibo</TableHead>
              <TableHead className="text-right">Monto (Bs.)</TableHead>
              <TableHead className="text-right">Monto (€)</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((rec) => (
                <TableRow key={rec.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium">{rec.paymentDate}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-primary">{rec.description}</div>
                    <div className="text-xs text-muted-foreground">Recibo: {rec.receiptNumber}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(rec.amountBolivares)} Bs.
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-700">
                    {formatCurrency(rec.amountEuros)} €
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                       <Button variant="ghost" size="icon" onClick={() => setEditingRecord(rec)}><Pencil className="h-4 w-4" /></Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Descargar PDF" 
                        onClick={() => exportPDF(rec)}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Eliminar registro">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente el registro de impuestos de la base de datos central.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(rec.id!)} 
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              Eliminar Registro
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {editingRecord && (
        <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Editar Pago</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[70vh] p-4">
              <TaxForm isEditMode initialData={editingRecord} onSuccess={handleEditSuccess} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
