import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { privateDocUrl } from '@/lib/privateDoc';
import { studentDocuments } from '@/lib/departmentStudents';
import { toast } from 'sonner';

const labelOf = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
const display = (value: unknown): string => {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.map(display).join(', ');
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${labelOf(k)}: ${display(v)}`).join('; ');
  return String(value);
};

export default function StudentFileDialog({ student, onClose }: { student: any; onClose: () => void }) {
  const [preview, setPreview] = useState<{ url: string; label: string; image: boolean } | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const openDocument = async (path: string, label: string) => {
    setOpening(path);
    try {
      const url = await privateDocUrl(path);
      setPreview({ url, label, image: /\.(jpe?g|png|webp|gif|heic)$/i.test(path) });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not open document'); }
    finally { setOpening(null); }
  };
  const section = (title: string, values: Record<string, unknown>) => (
    <section className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {Object.entries(values).map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs text-muted-foreground">{labelOf(key)}</dt><dd className="text-sm break-words">{display(value)}</dd></div>)}
      </dl>
    </section>
  );
  const academic = { ...student?.grade_12_results };
  delete academic.personal_info;
  const documents = studentDocuments(student?.documents, student?.result_doc_path);
  return <Dialog open={!!student} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>Student file — {student?.profile?.full_name ?? 'Student'}</DialogTitle><DialogDescription>{student?.profile?.student_code} · {student?.program} · {student?.status}</DialogDescription></DialogHeader>
      <div className="space-y-6">
        {section('Personal information', { fullName: student?.profile?.full_name, email: student?.profile?.email, phone: student?.profile?.phone, ...student?.grade_12_results?.personal_info })}
        {section('Academic information', academic)}
        {section('Department choices and placement', { firstChoice: student?.first_choice, secondChoice: student?.second_choice, thirdChoice: student?.third_choice, currentDepartment: student?.placement?.current_department ?? student?.first_department, placedDepartment: student?.placement?.placed_department, placedField: student?.placement?.placed_field, entryExamScore: student?.placement?.exam_score, decision: student?.placement?.decision, notes: student?.placement?.notes })}
        <section className="space-y-3"><h3 className="font-semibold">Documents ({documents.length})</h3>
          {!documents.length && <p className="text-sm text-muted-foreground">No documents submitted.</p>}
          <div className="flex flex-wrap gap-2">{documents.map(doc => <Button key={doc.path} size="sm" variant="outline" disabled={opening !== null} onClick={() => openDocument(doc.path, doc.label)}><FileText className="mr-2 h-4 w-4" />{opening === doc.path ? 'Opening…' : doc.label}</Button>)}</div>
          {preview && <div className="space-y-2"><p className="text-sm font-medium">{preview.label}</p>{preview.image ? <img src={preview.url} alt={preview.label} className="max-h-[60dvh] w-full object-contain" /> : <iframe src={preview.url} title={preview.label} className="h-[60dvh] w-full border border-border" />}</div>}
        </section>
      </div>
    </DialogContent>
  </Dialog>;
}