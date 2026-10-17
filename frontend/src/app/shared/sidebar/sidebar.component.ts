import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);

  isMobileOpen = input<boolean>(false);
  closeSidebar = output<void>();

  onLinkClick() {
    this.closeSidebar.emit();
  }

  logout() {
    this.authService.logout();
    this.closeSidebar.emit();
  }
}
