import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, DataTable } from '../../components/ui';
import type { Column } from '../../components/ui';
import type { Investor } from '../../data';
import { useToast, type PositionView } from '../../state';
import { date as fmtDate } from '../../lib/format';
import { contractSummary, downloadText, monthLabel, monthlyStatement, statementIssueDate, statementMonths } from './docs';

/* Extratos mensais e resumos de condições, gerados a partir dos dados de demonstração. */

interface DocRow {
  id: string;
  kind: 'Extrato mensal' | 'Condições do lote';
  title: string;
  ref: string;
  date: string;
  file: string;
  build: () => string;
}

export function Documents({ investor, positions }: { investor: Investor; positions: PositionView[] }) {
  const { toast } = useToast();
  const [all, setAll] = useState(false);
  const months = statementMonths(positions);
  const shownMonths = all ? months : months.slice(0, 3);
  const rows: DocRow[] = [
    ...shownMonths.map((ym) => ({
      id: `ext-${ym}`,
      kind: 'Extrato mensal' as const,
      title: `Extrato de ${monthLabel(ym)}`,
      ref: `EXT-${ym.replace('-', '')}`,
      date: statementIssueDate(ym),
      file: `Sprout_extrato_${ym}.txt`,
      build: () => monthlyStatement(investor, positions, ym),
    })),
    ...positions.map((p) => ({
      id: `cond-${p.id}`,
      kind: 'Condições do lote' as const,
      title: `Resumo das condições · ${p.lot.id}`,
      ref: p.id.toUpperCase(),
      date: p.committedAt.slice(0, 10),
      file: `Sprout_condicoes_${p.lot.id}.txt`,
      build: () => contractSummary(investor, p),
    })),
  ];

  const download = (r: DocRow) => {
    const ok = downloadText(r.file, r.build());
    toast(ok ? { tone: 'neutral', title: 'Documento descarregado', description: r.file } : { tone: 'crit', title: 'Não foi possível descarregar', description: 'O browser bloqueou a transferência. Tenta noutra janela.' });
  };

  const columns: Column<DocRow>[] = [
    {
      key: 'title',
      header: 'Documento',
      render: (r) => (
        <span className="block min-w-0">
          <span className="block font-medium text-fg">{r.title}</span>
          <span className="block font-mono text-xs text-muted tnum">{r.ref}</span>
        </span>
      ),
      sortValue: (r) => r.title,
      minWidth: 200,
    },
    { key: 'date', header: 'Data', render: (r) => fmtDate(r.date), sortValue: (r) => r.date, mono: true, align: 'right' },
    {
      key: 'dl',
      header: 'Descarregar',
      srHeader: true,
      align: 'right',
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => download(r)} iconLeft={<Download aria-hidden className="size-4" strokeWidth={1.75} />} aria-label={`Descarregar ${r.title}`}>
          .txt
        </Button>
      ),
    },
  ];

  return (
    <div className="min-w-0">
      <DataTable<DocRow> columns={columns} rows={rows} getRowId={(r) => r.id} caption="Extratos e documentos da carteira" initialSort={{ key: 'date', dir: 'desc' }} framed={false} />
      {months.length > 3 && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'Mostrar só os 3 últimos extratos' : `Mostrar os ${months.length} extratos mensais`}
        </Button>
      )}
    </div>
  );
}
