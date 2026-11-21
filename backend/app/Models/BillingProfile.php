<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'business_name', 'gstin', 'address', 'state'])]
class BillingProfile extends Model
{
    /** Shape of web BillingProfile. */
    public function toStudentArray(): array
    {
        return [
            'businessName' => $this->business_name,
            'gstin' => $this->gstin,
            'address' => $this->address,
            'state' => $this->state,
        ];
    }
}
