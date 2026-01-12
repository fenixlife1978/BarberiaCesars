'use client';

import { useMemo, useState, useEffect } from 'react';
import { type EconomicLicense, type Settings } from '@/types';
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
import { FilterX, Eye, Trash2, FileDown, Loader2, Download, Pencil, BadgeInfo } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ScrollArea } from '../ui/scroll-area';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import EconomicLicenseForm from './EconomicLicenseForm';
import { useDoc } from '@/firebase/firestore/use-doc';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type EconomicLicensesTableProps = {
  records: EconomicLicense[];
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
        link.download = `licencia-digital-${new Date().getTime()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="relative aspect-square w-full group overflow-hidden rounded-md border border-slate-200">
                    <NextImage src={src} alt="Documento" fill className="object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="text-white h-6 w-6" />
                    </div>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Documento Digitalizado</DialogTitle>
                </DialogHeader>
                <div className="flex-grow relative my-4 bg-slate-100 rounded-md">
                    <NextImage src={src} alt="Vista previa completa" fill style={{ objectFit: 'contain' }} />
                </div>
                 <Button onClick={handleDownload} className="self-end bg-primary">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Imagen
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default function EconomicLicensesTable({ records = [], isLoading }: EconomicLicensesTableProps) {
  const [filter, setFilter] = useState('');
  const [editingLicense, setEditingLicense] = useState<EconomicLicense | null>(null);
  const { toast } = useToast();
  const user = useAuth();
  const { firestore } = initializeFirebase();

  // PROTECCIÓN: Si no hay usuario, no intentamos crear referencias de documentos
  const settingsRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, `users/default-user/settings/general`);
  }, [user, firestore]);

  const { data: settings } = useDoc<Settings>(settingsRef);
  const companyName = settings?.companyName || 'Alcaldía Municipal';
  const logoUrl = settings?.logoUrl;

  const filteredLicenses = useMemo(() => {
    if (!records) return [];
    return records.filter((license) => {
      const searchTerm = filter.toLowerCase();
      return (
        license.taxpayerName?.toLowerCase().includes(searchTerm) ||
        license.taxpayerId?.toLowerCase().includes(searchTerm) ||
        license.licenseNumber?.toLowerCase().includes(searchTerm)
      );
    });
  }, [records, filter]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    // RUTA CENTRALIZADA: Asegurar que borramos del nodo compartido
    const licenseRef = doc(firestore, `users/default-user/economicLicenses`, id);
    try {
        deleteDocumentNonBlocking(licenseRef);
        toast({ title: 'Éxito', description: 'Licencia eliminada correctamente.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No tiene permisos para eliminar.' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(amount);
  }
  
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A";
      return format(new Date(dateString + 'T00:00:00'), "dd/MM/yyyy", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  }

  const exportToPDF = (license: EconomicLicense) => {
    const doc = new jsPDF();
    const emissionDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });

    doc.setFontSize(16);
    doc.text(companyName, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`REPORTE DE LICENCIA ECONÓMICA - ${license.licenseNumber}`, 14, 26);
    doc.text(`Fecha de impresión: ${emissionDate}`, 196, 26, { align: 'right' });

    doc.autoTable({
      startY: 35,
      head: [['Campo', 'Información Detallada']],
      body: [
        ['Contribuyente', license.taxpayerName],
        ['C.I. / RIF', license.taxpayerId],
        ['Capital Social', `${formatCurrency(license.capital)} Bs.`],
        ['Dirección Fiscal', license.fiscalAddress],
        ['Representante Legal', `${license.legalRepresentative} (${license.legalRepresentativeId})`],
        ['Nro. Catastro', license.cadastreNumber],
        ['Vencimiento', formatDate(license.expirationDate)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('RUBROS AUTORIZADOS', 14, finalY + 10);

    doc.autoTable({
      startY: finalY + 15,
      head: [['Código', 'Descripción', 'Alícuota', 'Mín. Imputable']],
      body: license.authorizedActivities.map(act => [
        act.code, 
        act.description, 
        `${act.aliquot}%`, 
        `${formatCurrency(act.taxableMinimum)} Bs.`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [46, 204, 113] },
    });

    doc.save(`Licencia_${license.licenseNumber}.pdf`);
  };

  // Si el usuario no está autenticado, no renderizamos nada para evitar errores de permisos
  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Buscar por nombre, RIF o licencia..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md shadow-sm"
        />
        <Button variant="outline" size="sm" onClick={() => setFilter('')} disabled={!filter}>
          <FilterX className="mr-2 h-4 w-4" /> Limpiar
        </Button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[150px]">Nro. Licencia</TableHead>
              <TableHead>Contribuyente</TableHead>
              <TableHead>C.I. / RIF</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                       <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                       <p className="mt-2 text-sm text-slate-500">Accediendo a la base de datos central...</p>
                    </TableCell>
                </TableRow>
            ) : filteredLicenses.length > 0 ? (
              filteredLicenses.map((license) => (
                <TableRow key={license.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-primary">{license.licenseNumber}</TableCell>
                  <TableCell className="font-medium">{license.taxpayerName}</TableCell>
                  <TableCell>{license.taxpayerId}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        new Date(license.expirationDate) < new Date() 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                        {formatDate(license.expirationDate)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Ver detalles"><Eye className="h-4 w-4 text-slate-600" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <BadgeInfo className="h-5 w-5 text-primary" />
                                        Expediente de Licencia: {license.licenseNumber}
                                    </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="pr-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                                        <div className="space-y-4">
                                            <section>
                                                <h4 className="text-sm font-bold uppercase text-slate-500 mb-2 border-b">Datos Generales</h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <span className="text-slate-500">Razon Social:</span> <span className="font-medium">{license.taxpayerName}</span>
                                                    <span className="text-slate-500">RIF:</span> <span className="font-medium">{license.taxpayerId}</span>
                                                    <span className="text-slate-500">Capital:</span> <span className="font-medium">{formatCurrency(license.capital)} Bs.</span>
                                                    <span className="text-slate-500">Catastro:</span> <span className="font-medium">{license.cadastreNumber}</span>
                                                </div>
                                            </section>
                                            <section>
                                                <h4 className="text-sm font-bold uppercase text-slate-500 mb-2 border-b">Ubicación y Legal</h4>
                                                <p className="text-sm"><strong>Dirección:</strong> {license.fiscalAddress}</p>
                                                <p className="text-sm mt-1"><strong>Rep. Legal:</strong> {license.legalRepresentative}</p>
                                            </section>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase text-slate-500 mb-2 border-b">Rubros Autorizados</h4>
                                            <div className="rounded-md border overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50 text-[10px]">
                                                        <TableRow>
                                                            <TableHead>Código</TableHead>
                                                            <TableHead>Alícuota</TableHead>
                                                            <TableHead>Mínimo</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody className="text-xs">
                                                        {license.authorizedActivities.map((act, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="font-medium">{act.code}</TableCell>
                                                                <TableCell>{act.aliquot}%</TableCell>
                                                                <TableCell>{formatCurrency(act.taxableMinimum)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </div>
                                    {license.documents && license.documents.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-sm font-bold uppercase text-slate-500 mb-3">Soportes Digitales</h4>
                                            <div className="grid grid-cols-4 gap-4">
                                                {license.documents.map((url, i) => (
                                                    <DocumentPreviewDialog key={i} src={url} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="icon" onClick={() => setEditingLicense(license)} title="Editar">
                            <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => exportToPDF(license)} title="Descargar PDF">
                            <FileDown className="h-4 w-4 text-green-600" />
                        </Button>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Se borrará la licencia <strong>{license.licenseNumber}</strong> permanentemente de la base central.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(license.id)} className="bg-destructive text-white hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500 text-sm italic">
                    No hay licencias registradas en el sistema.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingLicense && (
        <Dialog open={!!editingLicense} onOpenChange={(open) => !open && setEditingLicense(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
                <DialogTitle>Actualizar Licencia Económica</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[75vh] pr-4">
              <EconomicLicenseForm isEditMode initialData={editingLicense} onSuccess={() => setEditingLicense(null)} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
