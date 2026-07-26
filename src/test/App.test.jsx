import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import AppRoutes from '../routes/AppRoutes';
import { renderWithProviders } from './testUtils';
import { removeStoredToken, removeStoredUser } from '../lib/auth';

describe('Arche Archives App & Public Routes Tests', () => {
  beforeEach(() => {
    // Clear auth state before each test
    removeStoredToken();
    removeStoredUser();
    localStorage.clear();
  });

  test('App mounts and renders without throwing', async () => {
    const { container } = renderWithProviders(<AppRoutes />, { initialEntries: ['/'] });
    expect(container).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/Arche Archives/i)[0]).toBeInTheDocument();
    });
  });

  test('Public home route renders hero and featured sections', async () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/'] });
    await waitFor(() => {
      expect(screen.getByText(/Preserving History/i)).toBeInTheDocument();
      expect(screen.getByText(/Browse Catalog/i)).toBeInTheDocument();
    });
  });

  test('Public books route renders catalog books', async () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/books'] });
    await waitFor(() => {
      expect(screen.getAllByText(/The Hamlet/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/William Faulkner/i)[0]).toBeInTheDocument();
    });
  });

  test('Public book detail route renders book telemetry details', async () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/books/the-hamlet'] });
    await waitFor(() => {
      expect(screen.getAllByText(/The Hamlet/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/William Faulkner/i)[0]).toBeInTheDocument();
    });
  });

  test('Visitor clicking download redirects to /login', async () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/books/the-hamlet'] });
    
    // Wait for download buttons to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Log in to download PDF/i })).toBeInTheDocument();
    });

    const pdfButton = screen.getByRole('button', { name: /Log in to download PDF/i });
    fireEvent.click(pdfButton);

    // Verify localStorage has redirect information
    expect(localStorage.getItem('redirect_download_slug')).toBe('the-hamlet');
    expect(localStorage.getItem('redirect_download_format')).toBe('pdf');

    // Should redirect user to login page
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Verify & Access Library/i })).toBeInTheDocument();
    });
  });

  test('Public login form renders inputs and submit trigger', async () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/login'] });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/reader@example.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Verify & Access Library/i })).toBeInTheDocument();
    });
  });

  test('Register form renders setup options', async () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/register'] });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Jane Doe/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/reader@example.com/i)).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/••••••••/i)[0]).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/••••••••/i)[1]).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Reader Account/i })).toBeInTheDocument();
    });
  });

  test('Admin login form renders staff command portal inputs', async () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/admin/login'] });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/operator@arche.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Verify Staff Credentials/i })).toBeInTheDocument();
    });
  });
});
