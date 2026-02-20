'use client';

import Link from 'next/link';

export default function Model3() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="card-title mb-0">Model 3</h1>
                <Link href="/ml-models" className="btn btn-outline-secondary">
                  Back to Models
                </Link>
              </div>

              <div className="alert alert-warning" role="alert">
                <strong>Coming Soon!</strong> This model page is currently under development.
              </div>

              <p className="text-muted">
                Model 3 content will be added here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
