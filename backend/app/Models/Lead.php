<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'email', 'phone', 'business_goals', 'source', 'status', 'assigned_to', 'notes'])]
class Lead extends Model
{
}
