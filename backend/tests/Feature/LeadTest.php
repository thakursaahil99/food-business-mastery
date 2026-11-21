<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $over = []): array
    {
        return array_merge([
            'name' => 'Meera Joshi',
            'email' => 'Meera@Example.com',
            'phone' => '98765 43210',
            'business_goals' => 'Win a hospital contract',
        ], $over);
    }

    public function test_apply_form_creates_a_lead_with_normalised_contact(): void
    {
        $this->postJson('/api/v1/leads', $this->payload())->assertCreated();

        $this->assertDatabaseHas('leads', [
            'email' => 'meera@example.com',
            'phone' => '+919876543210',
            'source' => 'website',
            'status' => 'new',
        ]);
    }

    public function test_bad_phone_is_a_field_error(): void
    {
        $this->postJson('/api/v1/leads', $this->payload(['phone' => '12345']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('phone');
    }

    public function test_required_fields(): void
    {
        $this->postJson('/api/v1/leads', [])->assertStatus(422)->assertJsonValidationErrors(['name', 'email', 'phone']);
    }
}
