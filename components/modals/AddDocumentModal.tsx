// import { useState } from 'react'
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import api, { learnersAPI } from '@/lib/api';

// interface AddDocumentModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   learnerId: string;
//   onSuccess: () => void;
// }

// export default function AddDocumentModal({ isOpen, onClose, learnerId, onSuccess }: AddDocumentModalProps) {
//   const [file, setFile] = useState<File | null>(null)
//   const [name, setName] = useState('')
//   const [type, setType] = useState('')
//   const [loading, setLoading] = useState(false)

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const formData = new FormData();
//       if (file) {
//         formData.append('file', file);
//       }
//       formData.append('name', name);
//       formData.append('type', type);

//       await learnersAPI.uploadDocument(learnerId, formData);
//       onSuccess();
//     } catch (error) {
//       console.error('Error uploading document:', error);
//     } finally {
//       setLoading(false);
//       setFile(null);
//       setName('');
//       setType('');
//       onClose();
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Ajouter un document</DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="name">Nom du document</Label>
//             <Input
//               id="name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="type">Type de document</Label>
//             <Select value={type} onValueChange={setType} required>
//               <SelectTrigger id="type">
//                 <SelectValue placeholder="Sélectionner un type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="ID_CARD">Carte d'identité</SelectItem>
//                 <SelectItem value="CV">CV</SelectItem>
//                 <SelectItem value="DIPLOMA">Diplôme</SelectItem>
//                 <SelectItem value="OTHER">Autre</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="file">Fichier</Label>
//             <Input
//               id="file"
//               type="file"
//               onChange={(e) => setFile(e.target.files?.[0] || null)}
//               accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
//               required
//             />
//           </div>

//           <div className="flex justify-end space-x-2">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={onClose}
//               disabled={loading}
//             >
//               Annuler
//             </Button>
//             <Button type="submit" disabled={loading}>
//               {loading ? 'Envoi...' : 'Ajouter'}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }