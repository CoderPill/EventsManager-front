import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoginRequest } from '../../../core/models/login.request';

/**
 * Login modal component (standalone).
 */
@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule
  ],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss'
})
export class LoginModalComponent {
  @Output() loggedIn = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  public dialogRef = inject(MatDialogRef<LoginModalComponent>);
  private toast = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    const { username, password } = this.loginForm.value;
    const request: LoginRequest = { username: username?.trim(), password };
    this.auth.login(request).subscribe({
      next: () => {
        this.toast.success('¡Sesión iniciada exitosamente!');
        this.loggedIn.emit();
        this.dialogRef.close();
      },
      error: err => {
        const msg = err?.errors?.join('\n') || err?.message || 'Error al iniciar sesión';
        this.toast.error(msg);
      }
    });
  }
}
