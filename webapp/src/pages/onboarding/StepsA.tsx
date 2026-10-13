import { RadioGroup } from '../../components/ui';
import { CARGOS, docSlotsFor, ENTIDADES, EXAMPLE, isColetiva, NACIONALIDADES, PAISES, type Tipo } from './draft';
import { SF, TF } from './fields';
import { FieldGroup, FileDrop, Lbl, type StepProps } from './parts';
import { formatCertidao, formatDateInput, formatIban, formatNif, formatPostal } from './validation';

/* ------------------------------------------------------------ 1 · Perfil */

export function StepPerfil(p: StepProps) {
  const { d, set, err, isEx } = p;
  const chooseTipo = (v: Tipo) => {
    if (v === d.tipo) return;
    // com o exemplo ativo, trocar de tipo carrega o exemplo desse tipo
    if (d.example) set({ ...EXAMPLE[v] });
    else set({ tipo: v, docs: {} });
    p.touch('tipo');
  };
  return (
    <div className="flex flex-col gap-8">
      <div data-field="tipo">
        <RadioGroup<Tipo>
          legend={<Lbl ex={isEx('tipo')} visible>Vais investir como</Lbl>}
          name="ob-tipo"
          value={d.tipo || undefined}
          onChange={chooseTipo}
          options={[
            {
              value: 'pessoa-coletiva',
              label: 'Pessoa coletiva',
              description: 'Sociedade, holding, family office ou fundação. Pedimos o código da certidão permanente e os beneficiários efetivos.',
            },
            {
              value: 'pessoa-singular',
              label: 'Pessoa singular',
              description: 'Em nome próprio. No piloto só é possível se cumprires os critérios para seres tratado como investidor profissional.',
            },
          ]}
        />
        {err('tipo') && (
          <p className="mt-1 text-sm text-crit-ink" role="alert">
            {err('tipo')}
          </p>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SF
          k="pais"
          label="País de residência fiscal"
          p={p}
          options={PAISES}
          hint="O piloto aceita residentes fiscais na UE e no EEE. Os pagamentos passam só por rails licenciados na UE."
        />
        {isColetiva(d) && <SF k="entidade" label="Tipo de entidade" p={p} options={ENTIDADES} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 2 · Dados */

export function StepDados(p: StepProps) {
  const { d } = p;
  const col = isColetiva(d);
  return (
    <div className="flex flex-col gap-9">
      <FieldGroup title={col ? 'Entidade' : 'Identificação'} description={col ? 'Como consta da certidão permanente.' : 'Como consta do cartão de cidadão ou do passaporte.'}>
        <div className="grid gap-5 sm:grid-cols-2">
          {col ? (
            <>
              <TF k="denominacao" label="Denominação" p={p} autoComplete="organization" className="sm:col-span-2" />
              <TF k="nipc" label="NIPC" p={p} inputMode="numeric" format={formatNif} okHint="Algarismo de controlo confirmado" maxLength={11} />
            </>
          ) : (
            <>
              <TF k="nome" label="Nome completo" p={p} autoComplete="name" className="sm:col-span-2" />
              <TF k="nif" label="NIF" p={p} inputMode="numeric" format={formatNif} okHint="Algarismo de controlo confirmado" maxLength={11} />
              <TF k="nascimento" label="Data de nascimento" p={p} inputMode="numeric" autoComplete="bday" placeholder="dd/mm/aaaa" maxLength={10} format={formatDateInput} />
              <SF k="nacionalidade" label="Nacionalidade" p={p} options={NACIONALIDADES} />
            </>
          )}
        </div>
      </FieldGroup>

      <FieldGroup title={col ? 'Sede' : 'Morada de residência'}>
        <div className="grid gap-5 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <TF k="morada" label="Rua, número e andar" p={p} autoComplete="street-address" className="sm:col-span-2" />
          <TF
            k="codigoPostal"
            label="Código postal"
            p={p}
            inputMode="numeric"
            autoComplete="postal-code"
            format={(v) => formatPostal(v, d.pais)}
            maxLength={d.pais === 'PT' ? 8 : 16}
            placeholder={d.pais === 'PT' ? '0000-000' : undefined}
          />
          <TF k="localidade" label="Localidade" p={p} autoComplete="address-level2" />
        </div>
      </FieldGroup>

      {col && (
        <FieldGroup title="Representante legal" description="Quem assina por conta da entidade. Tem de constar da certidão permanente ou de uma procuração.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TF k="repNome" label="Nome completo" p={p} autoComplete="name" className="sm:col-span-2" />
            <TF k="repNif" label="NIF do representante" p={p} inputMode="numeric" format={formatNif} okHint="Algarismo de controlo confirmado" maxLength={11} />
            <SF k="repCargo" label="Cargo" p={p} options={CARGOS} />
          </div>
        </FieldGroup>
      )}

      <FieldGroup title="Contacto e conta bancária">
        <div className="grid gap-5 sm:grid-cols-2">
          <TF k="email" label="Email" p={p} type="email" autoComplete="email" />
          <TF k="telefone" label="Telefone" p={p} type="tel" autoComplete="tel" placeholder="+351 9xx xxx xxx" />
          <TF
            k="iban"
            label="IBAN da conta de origem"
            p={p}
            autoComplete="off"
            spellCheck={false}
            format={formatIban}
            maxLength={42}
            className="sm:col-span-2"
            okHint="IBAN válido · zona SEPA"
            hint={col ? 'Tem de estar em nome da entidade. Só aceitamos transferências SEPA de contas do próprio investidor, e é para esta conta que vão as liquidações.' : 'Tem de estar em teu nome. Só aceitamos transferências SEPA de contas do próprio investidor, e é para esta conta que vão as liquidações.'}
          />
        </div>
      </FieldGroup>
    </div>
  );
}

/* ------------------------------------------------------------ 3 · Documentos */

export function StepDocumentos(p: StepProps) {
  const { d, set, err } = p;
  const col = isColetiva(d);
  return (
    <div className="flex flex-col gap-8">
      {col && (
        <div className="max-w-[22rem]">
          <TF
            k="certidao"
            label="Código da certidão permanente"
            p={p}
            inputMode="numeric"
            format={formatCertidao}
            maxLength={14}
            placeholder="0000-0000-0000"
            okHint="Formato confirmado"
            hint="Com este código consultamos o registo comercial: sede, capital, gerência e objeto."
          />
        </div>
      )}
      {docSlotsFor(d).map((s) => (
        <FileDrop
          key={s.slot}
          id={`ob-doc-${s.slot}`}
          label={s.label}
          hint={s.hint}
          required={s.required}
          file={d.docs[s.slot]}
          error={err(`doc-${s.slot}`)}
          onFile={(f) => {
            set((x) => ({ docs: { ...x.docs, [s.slot]: f } }));
            p.touch(`doc-${s.slot}`);
          }}
          onRemove={() => {
            set((x) => {
              const docs = { ...x.docs };
              delete docs[s.slot];
              return { docs };
            });
            p.touch(`doc-${s.slot}`);
          }}
        />
      ))}
      <p className="measure text-sm text-muted">
        Nesta demonstração os ficheiros não saem do teu browser: confirmamos só o formato e o tamanho. Na operação real, seguem cifrados para o fornecedor de verificação de identidade e
        ficam guardados 7 anos depois do fim da relação, como exige a lei.
      </p>
    </div>
  );
}
