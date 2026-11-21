<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Certificate {{ $c->code }} · Redbean Academy</title>
    <meta name="robots" content="noindex">
    <style>
        :root { --red: #e01426; --red-dark: #bc0c1d; --ink: #07070a; --cream: #fdfbf8; --gold: #b8862f; --muted: #6b6b76; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #f1ede6; color: var(--ink); font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
        .wrap { max-width: 1060px; margin: 0 auto; padding: 24px 16px 40px; }
        .status { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 14px; margin-bottom: 18px; font-size: 16px; }
        .status.ok { background: #dcfce7; color: #14532d; }
        .status.bad { background: #fee2e2; color: #7f1d1d; }
        .status b { font-weight: 700; }
        .tick { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 800; }
        .ok .tick { background: #16a34a; } .bad .tick { background: #dc2626; }

        /* The certificate itself keeps A4 landscape proportions and scales with the screen. */
        .sheet { position: relative; aspect-ratio: 297 / 210; width: 100%; background: var(--cream); border-radius: 6px; box-shadow: 0 24px 60px -24px rgb(0 0 0 / .35); overflow: hidden; container-type: inline-size; }
        .frame { position: absolute; inset: 2.2cqw; border: .35cqw solid var(--red); }
        .frame::after { content: ""; position: absolute; inset: .8cqw; border: .12cqw solid var(--gold); }
        .bean { position: absolute; opacity: .06; width: 34cqw; right: -6cqw; bottom: -8cqw; transform: rotate(-24deg); }
        .bean.two { width: 20cqw; left: -4cqw; top: -5cqw; right: auto; bottom: auto; transform: rotate(30deg); }
        .content { position: absolute; inset: 5cqw 7cqw; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .logo { width: 13cqw; }
        .kicker { margin-top: 1.6cqw; font-size: 1.35cqw; letter-spacing: .5cqw; text-transform: uppercase; color: var(--gold); font-weight: 700; }
        .title { margin: .6cqw 0 0; font-family: Georgia, "Times New Roman", serif; font-size: 4.4cqw; font-weight: 700; color: var(--ink); }
        .given { margin-top: 1.8cqw; font-size: 1.55cqw; color: var(--muted); }
        .name { margin-top: .6cqw; font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 5.2cqw; line-height: 1.1; color: var(--red-dark); border-bottom: .12cqw solid #d9d2c5; padding: 0 3cqw .8cqw; }
        .for { margin-top: 1.6cqw; font-size: 1.55cqw; color: var(--muted); max-width: 70cqw; line-height: 1.5; }
        .course { display: block; margin-top: .4cqw; font-size: 2.3cqw; font-weight: 700; color: var(--ink); }
        .foot { margin-top: auto; width: 100%; display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 3cqw; }
        .sign { text-align: center; font-size: 1.3cqw; color: var(--muted); }
        .sign .line { border-top: .12cqw solid var(--ink); margin: 0 auto .6cqw; width: 20cqw; padding-top: .6cqw; font-family: Georgia, serif; font-style: italic; font-size: 2cqw; color: var(--ink); }
        .qr { text-align: center; }
        .qr svg { width: 9.5cqw; height: 9.5cqw; display: block; margin: 0 auto; }
        .qr svg path, .qr svg rect { fill: var(--ink); }
        .qr small { display: block; margin-top: .5cqw; font-size: 1.05cqw; color: var(--muted); letter-spacing: .1cqw; }

        .actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; }
        .btn { appearance: none; border: 0; cursor: pointer; min-height: 52px; padding: 0 22px; border-radius: 999px; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; }
        .btn.primary { background: var(--red); color: #fff; }
        .btn.quiet { background: #fff; color: var(--ink); border: 1px solid #e4e1da; }
        .note { text-align: center; color: var(--muted); font-size: 14px; margin-top: 12px; }
        .revoked { position: absolute; inset: 0; display: grid; place-items: center; font-size: 9cqw; font-weight: 800; color: rgb(220 38 38 / .22); transform: rotate(-18deg); letter-spacing: 1cqw; }

        @page { size: A4 landscape; margin: 0; }
        @media print {
            body { background: #fff; }
            .wrap { padding: 0; max-width: none; }
            .status, .actions, .note { display: none; }
            .sheet { border-radius: 0; box-shadow: none; width: 297mm; height: 210mm; aspect-ratio: auto; }
        }
    </style>
</head>
<body>
<main class="wrap">
    @if ($c->isValid())
        <div class="status ok" role="status"><span class="tick">✓</span><span><b>This certificate is real.</b> Issued by Red Bean Hospitality to {{ $c->student_name }} on {{ $c->issued_at->timezone('Asia/Kolkata')->format('j F Y') }}.</span></div>
    @else
        <div class="status bad" role="status"><span class="tick">!</span><span><b>This certificate was withdrawn</b> by Red Bean Hospitality and is no longer valid.</span></div>
    @endif

    <section class="sheet" aria-label="Certificate">
        <img class="bean" src="{{ asset('brand/redbean-mark.png') }}" alt="">
        <img class="bean two" src="{{ asset('brand/redbean-mark.png') }}" alt="">
        <div class="frame"></div>
        <div class="content">
            <img class="logo" src="{{ asset('brand/redbean-logo.png') }}" alt="Red Bean Hospitality">
            <div class="kicker">Redbean Academy</div>
            <h1 class="title">Certificate of Completion</h1>
            <div class="given">This is to certify that</div>
            <div class="name">{{ $c->student_name }}</div>
            <div class="for">
                has successfully completed
                <span class="course">{{ $c->course_title }}</span>
                @if ($c->batch) {{ $c->batch->name }} · @endif
                Issued {{ $c->issued_at->timezone('Asia/Kolkata')->format('j F Y') }}
            </div>
            <div class="foot">
                <div class="sign"><div class="line">Bobby Singh</div>Managing Director, Red Bean Hospitality</div>
                <div class="qr">{!! $qr !!}<small>{{ $c->code }}</small></div>
                @php($coach = $c->program?->coach?->name)
                @if ($coach && $coach !== 'Bobby Singh')
                    <div class="sign"><div class="line">{{ $coach }}</div>Course coach</div>
                @else
                    <div class="sign"><div class="line">Redbean Academy</div>Academic team</div>
                @endif
            </div>
        </div>
        @unless ($c->isValid())<div class="revoked">WITHDRAWN</div>@endunless
    </section>

    <div class="actions">
        <button class="btn primary" type="button" onclick="window.print()">Download / Print</button>
        <button class="btn quiet" type="button" id="copy" data-url="{{ $c->verifyUrl() }}">Copy link to share</button>
    </div>
    <p class="note">To save as a PDF, press Download / Print and choose "Save as PDF". Anyone can scan the QR code to check this certificate.</p>
</main>
<script>
  document.getElementById('copy').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(b.dataset.url); b.textContent = 'Link copied'; }
    catch { window.prompt('Copy this link', b.dataset.url); }
  });
</script>
</body>
</html>
