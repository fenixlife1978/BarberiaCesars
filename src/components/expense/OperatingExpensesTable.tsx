'use client';

import { useMemo, useState } from 'react';
import { type OperatingExpense } from '@/types';
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
import { FilterX, Eye, Trash2, Loader2, Download, Pencil } from 'lucide-react';
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
import OperatingExpenseForm from './OperatingExpenseForm';
import { Badge } from '../ui/badge';


type OperatingExpensesTableProps = {
  initialExpenses: OperatingExpense[];
  isLoading: boolean;
};

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

export default function OperatingExpensesTable({ initialExpenses, isLoading }: OperatingExpensesTableProps) {
  const [filter, setFilter] = useState('');
  const [editingExpense, setEditingExpense] = useState<OperatingExpense | null>(null);
  const { toast } = useToast();
  const user = useAuth();
  const userRole = useUserRole();

  const userIdToUse = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);

  const filteredExpenses = useMemo(() => {
    return (initialExpenses || []).filter((expense) => {
      const searchTerm = filter.toLowerCase();
      return (
        expense.description?.toLowerCase().includes(searchTerm) ||
        expense.category?.toLowerCase().includes(searchTerm) ||
        expense.date?.toLowerCase().includes(searchTerm)
      );
    });
  }, [initialExpenses, filter]);

  const handleDelete = async (id: string) => {
    if (!userIdToUse) return;
    const { firestore } = initializeFirebase();
    const expenseRef = doc(firestore, `users/${userIdToUse}/operatingExpenses`, id);
    try {
        await deleteDoc(expenseRef);
        toast({
            title: 'Éxito',
            description: 'Gasto eliminado con éxito.',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar el gasto.',
        });
    }
  };

  const handleEditSuccess = () => {
    setEditingExpense(null);
  };

  const clearFilters = () => {
    setFilter('');
  };
  
  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
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
          placeholder="Filtrar por descripción, categoría o fecha..."
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
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
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
            ) : filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(expense.amountEuros)}</TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ver detalles">
                           <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Detalles del Gasto</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh] p-4">
                          <div className="space-y-4 text-sm">
                            <p><strong className="font-medium text-muted-foreground">Fecha:</strong> {formatDate(expense.date)}</p>
                            <p><strong className="font-medium text-muted-foreground">Descripción:</strong> {expense.description}</p>
                            <p><strong className="font-medium text-muted-foreground">Categoría:</strong> <Badge variant="outline">{expense.category}</Badge></p>
                            <p><strong className="font-medium text-muted-foreground">Monto (Bs.):</strong> {formatCurrency(expense.amountBolivares, 'VES')}</p>
                            <p><strong className="font-medium text-muted-foreground">Tasa BCV:</strong> {formatCurrency(expense.bcvRate, 'VES')}</p>
                            <p><strong className="font-medium text-muted-foreground">Monto (€):</strong> {formatCurrency(expense.amountEuros, 'EUR')}</p>

                            {expense.documents && expense.documents.length > 0 && (
                                <div>
                                    <strong className="font-medium text-muted-foreground">Documentos Adjuntos:</strong>
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {expense.documents.map((doc, index) => (
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
                    <Button variant="ghost" size="icon" aria-label="Editar gasto" onClick={() => setEditingExpense(expense)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Eliminar gasto">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el registro del gasto.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(expense.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron gastos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       {editingExpense && (
        <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Gasto de Operación</DialogTitle>
            </DialogHeader>
             <ScrollArea className="max-h-[70vh] p-4">
              <OperatingExpenseForm isEditMode initialData={editingExpense} onSuccess={handleEditSuccess} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
