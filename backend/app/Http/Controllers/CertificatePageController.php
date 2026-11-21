<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Http\Response;

/** The public certificate page: what the QR code on the certificate opens. Printable as A4 landscape. */
class CertificatePageController extends Controller
{
    public function show(string $code): Response
    {
        $certificate = Certificate::where('code', strtoupper(trim($code)))->with('batch', 'program.coach')->first();

        if (! $certificate) {
            return response()->view('certificates.missing', ['code' => strtoupper(trim($code))], 404);
        }

        $qr = (new QRCode(new QROptions([
            'outputBase64' => false,
            'svgAddXmlHeader' => false,
            'addQuietzone' => false,
            'drawLightModules' => false,
        ])))->render($certificate->verifyUrl());

        return response()->view('certificates.show', ['c' => $certificate, 'qr' => $qr])
            ->header('X-Robots-Tag', 'noindex');
    }
}
