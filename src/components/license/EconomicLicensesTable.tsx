
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
import { FilterX, Eye, Trash2, FileDown, Loader2, Download, Pencil } from 'lucide-react';
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
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUserRole } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import EconomicLicenseForm from './EconomicLicenseForm';


type EconomicLicensesTableProps = {
  initialLicenses: EconomicLicense[];
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
        link.download = `documento-${new Date().toISOString()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="relative w-full h-full">
                    <Image src={src} alt="Documento" width={200} height={200} className="object-contain rounded-md border w-full h-full" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-5/6 flex flex-col">
                <DialogHeader>
                    <DialogTitle>Vista Previa del Documento</DialogTitle>
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

export default function EconomicLicensesTable({ initialLicenses, isLoading }: EconomicLicensesTableProps) {
  const [filter, setFilter] = useState('');
  const [editingLicense, setEditingLicense] = useState<EconomicLicense | null>(null);
  const { toast } = useToast();
  const user = useAuth();
  const userRole = useUserRole();

  const userIdToUse = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);

  const filteredLicenses = useMemo(() => {
    return (initialLicenses || []).filter((license) => {
      const searchTerm = filter.toLowerCase();
      return (
        license.taxpayerName?.toLowerCase().includes(searchTerm) ||
        license.taxpayerId?.toLowerCase().includes(searchTerm) ||
        license.licenseNumber?.toLowerCase().includes(searchTerm)
      );
    });
  }, [initialLicenses, filter]);

  const handleDelete = async (id: string) => {
    if (!userIdToUse) return;
    const { firestore } = initializeFirebase();
    const licenseRef = doc(firestore, `users/${userIdToUse}/economicLicenses`, id);
    try {
        await deleteDoc(licenseRef);
        toast({
            title: 'Éxito',
            description: 'Licencia eliminada con éxito.',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar la licencia.',
        });
    }
  };

  const handleEditSuccess = () => {
    setEditingLicense(null);
  };

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

  const exportToPDF = (license: EconomicLicense) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Detalles de la Licencia: ${license.licenseNumber}`, 14, 22);

    doc.setFontSize(12);
    doc.text('Información del Contribuyente', 14, 35);
    doc.autoTable({
      startY: 40,
      body: [
        ['C.I./RIF', license.taxpayerId],
        ['Contribuyente', license.taxpayerName],
        ['Capital', `${formatCurrency(license.capital)} Bs.`],
        ['Dirección Fiscal', license.fiscalAddress],
        ['Nro. Catastro', license.cadastreNumber],
        ['Rep. Legal', license.legalRepresentative],
        ['C.I. Rep. Legal', license.legalRepresentativeId],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    let finalY = (doc as any).lastAutoTable.finalY;
    doc.text('Información Propietario del Inmueble', 14, finalY + 10);
    doc.autoTable({
        startY: finalY + 15,
        body: [
            ['ID Propietario', license.propertyOwnerId],
            ['Propietario', license.propertyOwnerName],
            ['C.I./RIF', license.propertyOwnerCiRif],
            ['ID Inmueble', license.propertyId],
            ['Nro. Catastro Inmueble', license.propertyCadastreNumber],
        ],
        theme: 'grid',
        styles: { fontSize: 9 },
    });

    finalY = (doc as any).lastAutoTable.finalY;
    doc.text('Vigencia de la Licencia', 14, finalY + 10);
     doc.autoTable({
        startY: finalY + 15,
        body: [
            ['ID Contribuyente', license.taxpayerLicenseId],
            ['Fecha de Emisión', formatDate(license.issueDate)],
            ['Fecha de Vencimiento', formatDate(license.expirationDate)],
        ],
        theme: 'grid',
        styles: { fontSize: 9 },
    });

    finalY = (doc as any).lastAutoTable.finalY;
    doc.text('Rubros Autorizados', 14, finalY + 10);
    doc.autoTable({
      startY: finalY + 15,
      head: [['Código', 'Descripción', 'Alícuota', 'Mínimo Imputable']],
      body: license.authorizedActivities.map(act => [act.code, act.description, `${act.aliquot}%`, `${formatCurrency(act.taxableMinimum)} Bs.`]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
    });

    doc.save(`licencia_${license.licenseNumber}.pdf`);
  };


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
             {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                       <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                </TableRow>
            ) : filteredLicenses.length > 0 ? (
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
                                    <p><strong className="font-medium">ID Contribuyente:</strong> {license.taxpayerLicenseId}</p>
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
                                          <div key={index} className="relative aspect-square">
                                            <DocumentPreviewDialog src={doc} />
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
                    <Button variant="ghost" size="icon" aria-label="Editar licencia" onClick={() => setEditingLicense(license)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" aria-label="Exportar a PDF" onClick={() => exportToPDF(license)}>
                        <FileDown className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Eliminar licencia">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la licencia económica.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(license.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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

       {editingLicense && (
        <Dialog open={!!editingLicense} onOpenChange={(open) => !open && setEditingLicense(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Licencia Económica</DialogTitle>
            </DialogHeader>
             <ScrollArea className="max-h-[70vh] p-4">
              <EconomicLicenseForm isEditMode initialData={editingLicense} onSuccess={handleEditSuccess} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
