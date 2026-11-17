// lib/features/templates/reply_templates.dart — Account → Reply templates.
import { useState } from 'react';
import { useBusiness, useTemplates } from '../store';
import { invalidate } from '../lib/query';
import * as api from '../lib/api';
import { Card, ConfirmDialog, EmptyState, Gap, GradientButton, Icon, Sheet, useToast } from '../ui';
import { Loading, LoadError } from '../widgets';
import { AppBar } from './AppBar';

/** Add or edit one template. */
export function TemplateEditor({ existing, initialBody, onClose }: { existing?: api.ReplyTemplate; initialBody?: string; onClose: () => void }) {
  const b = useBusiness();
  const toast = useToast();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? initialBody ?? '');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.saveTemplate(b.id, { id: existing?.id, title, body });
      invalidate('templates');
      toast('Template saved.');
      onClose();
    } catch {
      toast('Could not save the template. Please try again.');
      setSaving(false);
    }
  };
  return (
    <Sheet onClose={onClose}>
      <h2 className="h-small">{existing ? 'Edit template' : 'New reply template'}</h2>
      <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>Use {'{name}'} for the reviewer's first name and {'{business}'} for your business name.</div>
      <Gap h={16} />
      <input className="input" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name, e.g. Thank you" />
      <div className="counter">{title.length}/60</div>
      <textarea className="input" rows={5} maxLength={1500} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Thank you, {name}! …" />
      <div className="counter">{body.length}/1500</div>
      <Gap h={8} />
      <GradientButton label="Save template" icon="bookmark_add" busy={saving} disabled={!title.trim() || !body.trim()} onClick={save} />
    </Sheet>
  );
}

export default function TemplatesScreen() {
  const b = useBusiness();
  const toast = useToast();
  const t = useTemplates();
  const [edit, setEdit] = useState<api.ReplyTemplate | 'new' | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <AppBar title="Reply templates" maxWidth={680} />
      <div className="page pushed" style={{ maxWidth: 680, paddingBottom: 100 }}>
        <Gap h={8} />
        <div className="muted" style={{ fontSize: 14, padding: '0 4px 16px' }}>Quick replies you can drop into any review reply, then edit before posting.</div>
        {t.error ? (
          <LoadError title="Couldn't load templates" error={t.error} onRetry={t.reload} />
        ) : !t.data ? (
          <Loading />
        ) : (
          <>
            {t.data.length === 0 && (
              <>
                <EmptyState icon="bookmarks" title="No templates yet" body="Start with a few ready-made ones, or write your own." />
                <Gap h={16} />
                <button
                  className="obtn"
                  disabled={adding}
                  onClick={async () => {
                    setAdding(true);
                    try {
                      await api.addStarterTemplates(b.id);
                      await invalidate('templates');
                    } catch {
                      toast('Could not add templates. Please try again.');
                    } finally {
                      setAdding(false);
                    }
                  }}
                >
                  <Icon name="auto_awesome" />Add 3 starter templates
                </button>
              </>
            )}
            <div className="col" style={{ gap: 12 }}>
              {t.data.map((x) => (
                <Card key={x.id} pad="12px 4px 14px 16px" onClick={() => setEdit(x)}>
                  <div className="row">
                    <span className="grow" style={{ fontWeight: 800, fontSize: 16 }}>{x.title}</span>
                    <button className="ibtn" title="Delete" onClick={(e) => { e.stopPropagation(); setDel(x.id); }}><Icon name="delete" color="var(--muted)" /></button>
                  </div>
                  <div className="muted clamp" style={{ WebkitLineClamp: 3, fontSize: 14.5, paddingRight: 12 }}>{x.body}</div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
      <button className="fab-wide" onClick={() => setEdit('new')}><Icon name="add" />New template</button>
      {edit && <TemplateEditor existing={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      {del && (
        <ConfirmDialog
          title="Delete this template?"
          body="It won't be offered in the reply box any more."
          action="Delete"
          danger
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            const id = del;
            setDel(null);
            try {
              await api.deleteTemplate(id);
              invalidate('templates');
            } catch {
              toast('Could not delete right now. Please try again.');
            }
          }}
        />
      )}
    </>
  );
}
